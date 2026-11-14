from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


class FastAPIRouteTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.env.stop()

    def test_read_endpoints(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        health = self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertTrue(health.json()["model_saved"])

        model = self.client.get("/api/model")
        self.assertEqual(model.status_code, 200)
        self.assertIn("similarity_formula", model.json())

        discoveries = self.client.get("/api/discoveries")
        self.assertEqual(discoveries.status_code, 200)
        self.assertEqual(discoveries.json()["count"], 20)
        self.assertEqual(discoveries.json()["discoveries"][0]["discovery_id"], "MARS-EARTH-01")

        one = self.client.get("/api/discoveries/MARS-EARTH-01")
        self.assertEqual(one.status_code, 200)
        self.assertEqual(one.json()["position_in_ranking"], 1)
        self.assertEqual(self.client.get("/api/discoveries/NOT-A-CANDIDATE").status_code, 404)

    def test_chat_compare_and_score(self):
        chat = self.client.post("/api/chat", json={"message": "Why is MARS-EARTH-01 ranked high?"})
        self.assertEqual(chat.status_code, 200)
        self.assertIn("MARS-EARTH-01", chat.json()["answer"])
        self.assertEqual(self.client.post("/api/chat", json={"message": " "}).status_code, 400)

        comparison = self.client.post(
            "/api/compare",
            json={"id_a": "MARS-EARTH-01", "id_b": "MARS-EARTH-02"},
        )
        self.assertEqual(comparison.status_code, 200)
        self.assertEqual(len(comparison.json()["comparison"]), 4)

        row = {
            "elevation": 425,
            "slope_deg": 0.7870628,
            "local_relief": 325,
            "roughness": 127.2604,
        }
        scored = self.client.post("/api/score", json={"rows": [row]})
        self.assertEqual(scored.status_code, 200)
        self.assertAlmostEqual(scored.json()["scores"][0]["similarity_score"], 0.6759074, places=5)
        self.assertEqual(self.client.post("/api/score", json={"rows": [{"elevation": 1}]}).status_code, 400)

    def test_configurable_cors(self):
        response = self.client.options(
            "/api/chat",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:5173")


if __name__ == "__main__":
    unittest.main()
