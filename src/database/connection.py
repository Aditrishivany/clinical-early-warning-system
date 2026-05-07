"""
Database connection management — SQLite with proper pooling config.
Swap DATABASE_URL in .env to switch to PostgreSQL with zero code changes.
"""

import logging
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from config.settings import settings

logger = logging.getLogger(__name__)

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if _is_sqlite else {}

# StaticPool for SQLite (single connection, thread-safe via check_same_thread=False)
# NullPool or QueuePool for PostgreSQL (handled automatically by SQLAlchemy)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    poolclass=StaticPool if _is_sqlite else None,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

# Enable WAL mode for SQLite for better concurrent read performance
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db_session():
    return SessionLocal()


def create_tables():
    """Create all tables — idempotent."""
    from src.database import models  # noqa: F401 — ensures models are registered
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready")
