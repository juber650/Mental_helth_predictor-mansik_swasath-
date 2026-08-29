# MindScope UI

Frontend for the FastAPI mental-health prediction API.

## Files
- `index.html` — interface
- `style.css` — responsive styling and animations
- `script.js` — form validation and API integration

## Run
1. Start your FastAPI server:
   `python -m uvicorn main:app --port 2200 --reload`
2. Serve this folder from a local web server (recommended), for example VS Code Live Server.
3. Open `index.html` through the local server.
4. Submit the form. The JS sends JSON to:
   `http://127.0.0.1:2200/predict`

## Important backend fixes
Your posted Pydantic model defines fields with capital letters (`Age`, `Gender`, etc.), so the endpoint must access `data.Age`, `data.Gender`, etc. It currently uses lowercase attributes such as `data.age`, which will cause an error.

Also, `country_group` is calculated but the DataFrame currently sends `Country: data.country`. If the trained model was trained with `Grouped_Country`, make sure the exact feature columns and preprocessing match training.
