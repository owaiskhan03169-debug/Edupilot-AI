from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb+srv://obaidagulf22_db_user:GdBvsMayc0zA84QO@edupilot.xqb5raz.mongodb.net/edupilot?appName=edupilot"
    GEMINI_API_KEY: str = ""
    APP_NAME: str = "EduPilot AI"
    DEBUG: bool = True

    class Config:
        env_file = ".env"

settings = Settings()