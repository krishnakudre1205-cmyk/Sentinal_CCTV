from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Configure connection args specifically for SQLite if used
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# SQLAlchemy Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG
)

# Session Local factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for models
Base = declarative_base()


def get_db():
    """
    Dependency helper to obtain a database session per request.
    Ensures safe session closing after request lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables and run automatic schema migration checks for SQLite development DB.
    """
    import app.models  # noqa
    Base.metadata.create_all(bind=engine)

    # Auto-migration column checks
    with engine.connect() as conn:
        from sqlalchemy import text
        # Check watchlist table columns
        try:
            conn.execute(text("SELECT plate_number FROM watchlist LIMIT 1"))
        except Exception:
            try:
                conn.execute(text("ALTER TABLE watchlist ADD COLUMN plate_number VARCHAR(50)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE watchlist ADD COLUMN vehicle_description VARCHAR(200)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE watchlist ADD COLUMN reason TEXT"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE watchlist ADD COLUMN priority VARCHAR(50) DEFAULT 'HIGH'"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE watchlist ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE'"))
            except Exception:
                pass
            conn.commit()

        # Check alerts table columns
        try:
            conn.execute(text("SELECT alert_id FROM alerts LIMIT 1"))
        except Exception:
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN alert_id VARCHAR(100)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN priority VARCHAR(50) DEFAULT 'HIGH'"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN vehicle VARCHAR(150)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN plate VARCHAR(50)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN location VARCHAR(200)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN confidence FLOAT DEFAULT 0.90"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN evidence_image VARCHAR(500)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN snapshot_url VARCHAR(500)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE alerts ADD COLUMN plate_crop_url VARCHAR(500)"))
            except Exception:
                pass
            conn.commit()
