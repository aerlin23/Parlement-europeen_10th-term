#!/usr/bin/env python3
"""Browser smoke tests of the real static site in Chromium."""
import os
import functools
import http.server
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True

def check(page, condition, message):
    assert condition, message

def test(page, base):
    errors=[]
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(base, wait_until="domcontentloaded")
    page.wait_for_function("Number(document.querySelector('#total')?.textContent) >= 680", timeout=20000)
    check(page, page.locator("#grid .card").count()==40, "Directory must initially render 40 cards")
    check(page, page.locator("#total").inner_text() in page.locator("#count").inner_text(), "Count must cover entire dataset")
    page.locator("#search").fill("AALTOLA")
    check(page, page.locator("#grid .card").count()==1, "Name search failed")
    page.locator("#reset").click()
    page.locator("#group").select_option("PPE")
    check(page, page.locator("#grid .card").count()>0, "Group filter failed")
    check(page, page.locator("#total").inner_text() in page.locator("#count").inner_text(), "Filter changed total roster")
    page.locator("#reset").click()
    page.locator("#trainingTab").click()
    for mode in ("name-photo","photo-name"):
        page.locator("#quizMode").select_option(mode)
        page.locator("#startStudy").click()
        check(page, page.locator("#quizChoices button").count()==4, "Quiz must have exactly 4 answers")
        check(page, page.locator("#studyProgress").inner_text().startswith("Question 1 / 20"), "Quiz length is not 20")
        if mode=="name-photo":
            check(page, page.locator("#quizChoices img").count()==4, "Name-photo mode missing images")
        else:
            check(page, page.locator("#studyPhoto img").count()==1, "Photo-name mode missing main portrait")
        page.locator("#quizChoices button").first.click()
        check(page, page.locator("#listenName").is_visible(), "Audio replay button missing after answer")
        check(page, page.locator("#nextStudy").is_visible(), "Next question missing")
        page.locator("#nextStudy").click()
        check(page, page.locator("#quizChoices button").count()==4, "Next quiz question broken")
        page.locator("#stopStudy").click()
        page.locator("#restartStudy").click()
    # Une session complète doit aboutir à un bilan cohérent.
    page.locator("#quizMode").select_option("photo-name")
    page.locator("#startStudy").click()
    for question in range(20):
        check(page, page.locator("#quizChoices button").count()==4, "Four answers required at every question")
        page.locator("#quizChoices button").first.click()
        page.locator("#nextStudy").click()
    check(page, page.locator("#studyEnd").is_visible(), "Quiz must reach final results")
    check(page, "Questions répondues" in page.locator("#studyResult").inner_text(), "Quiz results missing")
    check(page, "Fautes" in page.locator("#studyResult").inner_text(), "Quiz error summary missing")
    page.locator("#restartStudy").click()
    # Vérifier la sauvegarde et son import, sans quitter le navigateur.
    with page.expect_download() as downloaded:
        page.locator("#exportProgress").click()
    backup=downloaded.value
    check(page, backup.suggested_filename.endswith(".json"), "Backup must be JSON")
    page.locator("#progressFile").set_input_files(str(backup.path()))
    check(page, "Progression restaurée" in page.locator("#backupStatus").inner_text(), "Backup import failed")
    check(page, not errors, "JavaScript runtime errors: "+repr(errors))

def main():
    handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT))
    with Server(("127.0.0.1",0),handler) as server:
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        base=f"http://127.0.0.1:{server.server_port}/"
        with sync_playwright() as playwright:
            engine=os.environ.get("TEST_BROWSER","chromium")
            if engine not in ("chromium","webkit"):
                raise RuntimeError("Unsupported browser: "+engine)
            browser=getattr(playwright,engine).launch(headless=True)
            try:
                context=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=2,accept_downloads=True)
                page=context.new_page()
                test(page,base)
                print("Smoke test PASSED:",engine,"directory, both quizzes, full session and backup")
            finally:
                browser.close()
if __name__=="__main__":
    main()
