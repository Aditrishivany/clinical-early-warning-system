"""
File: src/utils/logger.py
Purpose: Centralized logging for entire system
"""

import logging
import sys
from pathlib import Path
from datetime import datetime

# ─────────────────────────────────────────
# CREATE LOGS DIRECTORY
# ─────────────────────────────────────────
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────
# LOG FORMAT
# ─────────────────────────────────────────
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def get_logger(name: str) -> logging.Logger:
    """
    Get a named logger with file + console handlers.
    Usage: logger = get_logger(__name__)
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    # ── Console Handler ──
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

    # ── File Handler (daily log file) ──
    log_file = LOGS_DIR / f"clinical_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

    logger.addHandler(console)
    logger.addHandler(file_handler)

    return logger


# ─────────────────────────────────────────
# DEFAULT LOGGER
# ─────────────────────────────────────────
logger = get_logger("clinical_ai")