import uvicorn

HOST = "0.0.0.0"
PORT = 8765


def main():
    print("=" * 50)
    print("  Math GGB Platform starting...")
    print(f"  Open: http://localhost:{PORT}")
    print("  Press Ctrl+C to quit")
    print("=" * 50)

    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
