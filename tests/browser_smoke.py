#!/usr/bin/env python3
"""Browser smoke tests of the real static site in Chromium."""
import contextlib
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
    page.locator("#total").get_by_text("720").wait_for(timeout=20000)
    check(page, page.locator("#grid .card").count()==40, "Directory must initially render 40 cards")
    check(page, "720" in page.locator("#count").inner_text(), "Count must cover entire dataset")
    page.locator("#search").fill("AALTOLA")
    check(page, page.locator("#grid .card").count()==1, "Name search failed")
    page.locator("#reset").click()
    page.locator("#group").select_option("PPE")
    check(page, page.locator("#grid .card").count()>0, "Group filter failed")
    check(page, "720" in page.locator("#count").inner_text(), "Filter changed total roster")
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
        page.locator("#trainingTab").click()
    check(page, not errors, "JavaScript runtime errors: "+repr(errors))

def main():
    handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT))
    with Server(("127.0.0.1",0),handler) as server:
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        base=f"http://127.0.0.1:{server.server_port}/"
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True)
            try:
                page=browser.new_page(viewport={"width":390,"height":844},device_scale_factor=2)
                test(page,base)
                print("Smoke test PASSED: directory, filters, both quizzes, progression and sound button")
            finally:
                browser.close()
if __name__=="__main__":
    main()
