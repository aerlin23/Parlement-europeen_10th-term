#!/usr/bin/env python3
"""Offline regression checks; no external web services required."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
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

    def test_both_quiz_modes_stay_available(self):
        self.assertIn('id="quizMode"', HTML)
        self.assertIn('value="name-photo"', HTML)
        self.assertIn('value="photo-name"', HTML)
        self.assertIn("optionsFor(m,members,4)", HTML)
        self.assertIn("choices.length!==4", HTML)
        self.assertIn("session.mode==='name-photo'", HTML)
        self.assertIn("enableNamePronunciation(m)", HTML)
        self.assertIn("spacedDeck(eligible)", HTML)
        self.assertIn("QUIZ_PROGRESS_KEY", HTML)

    def test_pagination_keeps_entire_dataset(self):
        self.assertIn("DIRECTORY_PAGE_SIZE=40", HTML)
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

    def test_photo_fallback(self):
        self.assertIn("const thumb='./thumbs/'", HTML)
        self.assertIn("photoAssets.thumbs.has", HTML)
        self.assertIn("photo-assets.json", HTML)
        self.assertIn("availableLocal?[local,official]:[official]", HTML)

if __name__ == "__main__":
    unittest.main(verbosity=2)
