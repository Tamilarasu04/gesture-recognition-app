#!/usr/bin/env python3
"""Train RandomForest gesture classifier. Run from backend/: python scripts/train_model.py"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.services.gesture_service import create_default_model  # noqa: E402


def main():
    output_dir = BACKEND_DIR / "models"
    print(f"Training model -> {output_dir}")
    clf, encoder = create_default_model(output_dir)
    print(f"Classes: {list(encoder.classes_)}")
    print("Done. Deploy models/gesture_model.pkl and label_encoder.pkl with the app.")


if __name__ == "__main__":
    main()
