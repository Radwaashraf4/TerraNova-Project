import unittest

from integration_layer import moon
from fastapi.testclient import TestClient
import main


class MoonScreeningTests(unittest.TestCase):
    def test_dataset_contains_6000_ranked_earth_samples(self):
        rows = moon.load_candidates()
        self.assertEqual(len(rows), 6000)
        self.assertEqual(rows[0]["discovery_id"], "MOON-EARTH-01")
        self.assertGreaterEqual(rows[0]["similarity_index"], rows[1]["similarity_index"])

    def test_candidate_response_is_grounded(self):
        reply = moon.answer("Why is MOON-EARTH-01 ranked high?", ["MOON-EARTH-01"])
        self.assertIn("MOON-EARTH-01", reply["answer"])
        self.assertEqual(reply["mode"], "fallback")

    def test_general_moon_question_lists_candidates(self):
        reply = moon.answer("Show top Moon candidates")
        self.assertIn("MOON-EARTH-01", reply["answer"])
        self.assertIn("MOON-EARTH-05", reply["answer"])

    def test_limitations_are_explicit(self):
        reply = moon.answer("What are the limitations of the Moon index?")
        self.assertIn("scale", reply["answer"].lower())
        self.assertIn("climate", reply["answer"].lower())

    def test_fastapi_moon_routes(self):
        client = TestClient(main.app)
        listing = client.get("/api/moon/discoveries?limit=5")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["total_evaluated"], 6000)
        self.assertEqual(listing.json()["discoveries"][0]["discovery_id"], "MOON-EARTH-01")
        self.assertEqual(client.get("/api/moon/model").status_code, 200)
        self.assertEqual(client.get("/api/moon/discoveries/MOON-EARTH-01").status_code, 200)

    def test_fastapi_chat_routes_moon_context(self):
        client = TestClient(main.app)
        response = client.post("/api/chat", json={
            "message": "Why is this ranked high?",
            "discovery_ids": ["MOON-EARTH-01"],
            "history": []
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("MOON-EARTH-01", response.json()["answer"])
        compare = client.post("/api/moon/compare", json={
            "id_a": "MOON-EARTH-01", "id_b": "MOON-EARTH-02"
        })
        self.assertEqual(compare.status_code, 200)


if __name__ == "__main__":
    unittest.main()
