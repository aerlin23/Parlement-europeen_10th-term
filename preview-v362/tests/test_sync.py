import unittest
import xml.etree.ElementTree as ET
from scripts.monthly_sync import read_official

def sample_xml(count=700, group="Renew Europe Group"):
    root=ET.Element("meps")
    for i in range(count):
        item=ET.SubElement(root,"mep")
        ET.SubElement(item,"id").text=str(100000+i)
        ET.SubElement(item,"fullName").text=f"Example Member {i}"
        ET.SubElement(item,"country").text="BE"
        ET.SubElement(item,"politicalGroup").text=group
    return root

class MonthlySyncContract(unittest.TestCase):
    def test_official_fixture_is_recognized(self):
        parsed=read_official(sample_xml())
        self.assertEqual(len(parsed),700)
        self.assertEqual(parsed[0]["country"],"Belgium")
        self.assertEqual(parsed[0]["group"],"Renew")

    def test_source_schema_change_fails_closed(self):
        root=sample_xml()
        for member in root:
            member.find("politicalGroup").tag="unexpectedGroupTag"
        with self.assertRaises(ValueError):
            read_official(root)

    def test_short_lists_are_rejected(self):
        with self.assertRaises(ValueError):
            read_official(sample_xml(20))

    def test_duplicate_ids_are_rejected(self):
        root=sample_xml()
        root[1].find("id").text=root[0].find("id").text
        with self.assertRaises(ValueError):
            read_official(root)

if __name__=="__main__":
    unittest.main()
