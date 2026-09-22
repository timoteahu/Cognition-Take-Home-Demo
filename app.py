from fastapi import FastAPI

app = FastAPI(title="take-home-demo")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello, world!"}
