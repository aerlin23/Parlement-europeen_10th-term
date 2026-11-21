#!/usr/bin/env python3
"""Offline regression checks; no external web services required."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKUP = (ROOT / "index.html").read_text(encoding="utf-8")
HTML = MARKUP + "\n" + "\n".join((ROOT / p).read_text(encoding="utf-8") for p in re.findall(r'<script src="\./([^"?]+)(?:\?[^"]+)?"' , MARKUP))
SW = (ROOT / "sw.js").read_text(encoding="utf-8")
MEMBERS = json.loads((ROOT / "members.json").read_text(encoding="utf-8"))
COMMITTEES = json.loads((ROOT / "committees.json").read_text(encoding="utf-8"))
MANIFEST = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
GROUPS = {"PPE", "S&D", "PfE", "ECR", "Renew", "Verts/ALE", "The Left", "ESN", "NI"}

class DirectoryContract(unittest.TestCase):
    def test_members_count_and_ids(self):
        self.assertGreaterEqual(len(MEMBERS), 680)
        self.assertLessEqual(len(MEMBERS), 735)
        ids = [str(m["id"]) for m in MEMBERS]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(re.fullmatch(r"[0-9]{1,9}", i) for i in ids))

    def test_members_essential_fields(self):
        for m in MEMBERS:
            with self.subTest(mep=m["id"]):
                self.assertTrue(m.get("name", "").strip())
                self.assertIn(m.get("group"), GROUPS)
                self.assertTrue(m.get("country", "").strip())
                self.assertIn(m.get("gender", ""), ("MALE", "FEMALE", ""))
                self.assertIsInstance(m.get("committees", []), list)

    def test_committees_referential_integrity(self):
        self.assertGreaterEqual(len(COMMITTEES), 20)
        codes = set(COMMITTEES)
        for m in MEMBERS:
            for c in m.get("committees", []):
                with self.subTest(mep=m["id"], committee=c):
                    self.assertIn(c.get("code"), codes)

    def test_hemicycle_seats_are_sourced_and_displayed_only_if_known(self):
        seat_file = json.loads((ROOT / "hemicycle-seats.json").read_text(encoding="utf-8"))
        member_ids = {str(m["id"]) for m in MEMBERS}
        seats = seat_file["seats"]
        self.assertGreater(len(seats), 0)
        self.assertTrue(set(seats).issubset(member_ids))
        for location in ("str", "bru"):
            taken = [item[location] for item in seats.values() if item.get(location) is not None]
            self.assertEqual(len(taken), len(set(taken)))
            self.assertTrue(all(isinstance(x, int) and 1 <= x <= 999 for x in taken))
        self.assertIn("function hemicycleBlock(m)", HTML)
        self.assertIn("if(!seats||(!Number.isInteger(seats.str)&&!Number.isInteger(seats.bru)))return null;", HTML)
        self.assertIn("if(seats)info.append(seats)", HTML)
        self.assertIn("hemicycle-seats.json", HTML)
        self.assertIn("'./hemicycle-seats.json'", SW)

    def test_both_quiz_modes_stay_available(self):
        self.assertIn('id="quizMode"', HTML)
        self.assertIn('value="name-photo"', HTML)
        self.assertIn('value="photo-name"', HTML)
        self.assertIn("optionsFor(m,members,4)", HTML)
        self.assertIn("choices.length!==4", HTML)
        self.assertIn("session.questionMode==='name-photo'", HTML)
        self.assertIn("enableNamePronunciation(m)", HTML)
        self.assertIn("spacedDeck(eligible)", HTML)
        self.assertIn("QUIZ_PROGRESS_KEY", HTML)

    def test_secretariat_general_navigation(self):
        for element in ('secretariatNav','secretariatPanel','sgOrgGrid','sgSearch'):
            self.assertIn('id="'+element+'"', MARKUP)
        self.assertIn('function sgDrawOrg(', HTML)
        self.assertIn('function showSecretariat(', HTML)
        self.assertIn('Alessandro Chiocchetti', HTML)

    def test_pagination_keeps_entire_dataset(self):
        self.assertIn("DIRECTORY_PAGE_SIZE=matchMedia", HTML)
        self.assertIn("filtered=selectMembers()", HTML)
        self.assertIn("appendDirectoryPage()", HTML)
        self.assertIn("IntersectionObserver", HTML)

    def test_pwa_contract(self):
        self.assertEqual(MANIFEST["display"], "standalone")
        self.assertEqual(MANIFEST["scope"], "./")
        self.assertTrue((ROOT/"icon-192.png").exists())
        self.assertTrue((ROOT/"icon-512.png").exists())
        self.assertIn("const VERSION=", SW)
        self.assertIn("cache:'no-store'", SW)
        self.assertIn("navigator.serviceWorker.register", HTML)

    def test_update_requires_user_action(self):
        for tag in ('id="appUpdateNotice"', 'id="applyAppUpdate"', 'id="checkAppUpdate"'):
            self.assertIn(tag, HTML)
        self.assertIn("worker.postMessage({type:'SKIP_WAITING'})", HTML)
        self.assertIn("if(session)", HTML)

    def test_offline_shell_and_photo_cache_are_bounded(self):
        self.assertIn("'./members.json'", SW)
        self.assertIn("'./committees.json'", SW)
        self.assertIn("'./photo-assets.json'", SW)
        self.assertIn("cachePhoto(request)", SW)
        self.assertIn("keys.length>240", SW)

    def test_photo_fallback(self):
        self.assertIn("const thumb='./thumbs/'", HTML)
        self.assertIn("photoAssets.thumbs.has", HTML)
        self.assertIn("photo-assets.json", HTML)
        self.assertIn("availableLocal?[local,official]:[official]", HTML)

if __name__ == "__main__":
    unittest.main(verbosity=2)
