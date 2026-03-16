from google.genai import types

try:
    print("Test 1: Part.from_text('hello')")
    p1 = types.Part.from_text("hello")
    print(p1)
except Exception as e:
    print(f"Error 1: {e}")

try:
    print("\nTest 2: Part.from_text(text='hello')")
    p2 = types.Part.from_text(text="hello")
    print(p2)
except Exception as e:
    print(f"Error 2: {e}")

try:
    print("\nTest 3: types.Content dictionary unpacking vs instantiation")
    c = types.Content(role="user", parts=[types.Part.from_text(text="hello")])
    print(c)
except Exception as e:
    print(f"Error 3: {e}")
