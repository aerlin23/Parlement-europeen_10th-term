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
    check(page, 1 <= page.locator("#grid .card").count() <= 40, "Directory must render its first batch of cards")
    check(page, page.locator("#total").inner_text() in page.locator("#count").inner_text(), "Count must cover entire dataset")
    page.locator("#search").fill("AALTOLA")
    check(page, page.locator("#grid .card").count()==1, "Name search failed")
    page.locator("#reset").click()
    page.locator("#group").select_option("PPE")
    check(page, page.locator("#grid .card").count()>0, "Group filter failed")
    check(page, page.locator("#total").inner_text() in page.locator("#count").inner_text(), "Filter changed total roster")
    page.locator("#reset").click()
    # Vérifier la cohérence des neuf groupes politiques et le rendu des fiches.
    for group in ("PPE", "S&D", "PfE", "ECR", "Renew", "Verts/ALE", "The Left", "ESN", "NI"):
        page.locator("#group").select_option(group)
        check(page, page.locator("#grid .card").count() > 0, "No deputy cards in group "+group)
        check(page, page.locator("#grid .card .country-group-line").count() == page.locator("#grid .card").count(), "Country/group layout missing for "+group)
        check(page, page.locator("#grid .card .hemicycle-seats").count() > 0, "Seat information missing for "+group)
    page.locator("#reset").click()
    # Rechercher par place dans chaque hémicycle (les deux sièges 328 existent).
    for query in ("s328", "b328", "S328", "B328"):
        page.locator("#search").fill(query)
        check(page, page.locator("#grid .card").count() == 1, "Seat search failed: "+query)
        check(page, page.locator("#grid .card .hemicycle-seats").count() == 1, "Seat labels missing: "+query)
    page.locator("#reset").click()
    # Même présentation que les groupes : Secrétariat général dans la page courante.
    page.locator("#secretariatNav").click()
    check(page, page.locator("#secretariatPanel").is_visible(), "Secretariat must open inline")
    check(page, page.locator("#sgDirectorGrid .card").count() >= 10, "Secretariat director portraits missing")
    check(page, page.locator("#directory").is_hidden(), "Deputies must hide while SG is active")
    page.locator("#directoryTab").click()
    check(page, page.locator("#secretariatPanel").is_hidden(), "Secretariat must close without navigating away")
    check(page, page.locator("#directory").is_visible(), "Directory must be restored")
    page.locator("#trainingTab").click()
    for mode in ("name-photo","photo-name"):
        page.locator("#quizMode").select_option(mode)
        page.locator("#startStudy").click()
        check(page, page.locator("#quizChoices button").count()==4, "Quiz must have exactly 4 answers")
        check(page, page.locator("#studyProgress").inner_text().startswith("Question 1 / 20"), "Quiz length is not 20")
        if mode=="name-photo":
            check(page, page.locator("#quizChoices button.photo-choice").count()==4, "Name-photo mode missing four photo choices")
            check(page, page.locator("#quizChoices button.photo-choice").evaluate_all("(buttons) => buttons.every(b => b.querySelector('img, .fallback'))"), "Name-photo choice has neither photo nor fallback")
        else:
            check(page, page.locator("#studyPhoto .study-photo").count()==1, "Photo-name mode missing portrait container")
            check(page, page.locator("#studyPhoto img, #studyPhoto .fallback").count()==1, "Photo-name mode missing portrait or unavailable-photo fallback")
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
    page.wait_for_function("document.querySelector('#backupStatus')?.textContent.includes('Progression restaurée') || document.querySelector('#backupStatus')?.textContent.includes('Import refusé')", timeout=10000)
    check(page, "Progression restaurée" in page.locator("#backupStatus").inner_text(), "Backup import failed: "+page.locator("#backupStatus").inner_text())
    if os.environ.get("TEST_BROWSER", "chromium")=="chromium":
        page.wait_for_function("navigator.serviceWorker?.controller != null",timeout=15000)
        page.context.set_offline(True)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("Number(document.querySelector('#total')?.textContent) >= 680",timeout=15000)
        check(page, page.locator("#quizMode").count()==1, "Quiz modes unavailable offline")
        page.context.set_offline(False)
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
