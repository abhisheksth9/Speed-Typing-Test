# Speed Typing Test Web App
A Flask Web Application that lets users practice typing, view real-time stats like Words Per Minute(WPM) and accuracy, and track historical scores with interactive charts

## Features
**User Authentication:** <br>
  - Sign Up / Login / Logout <br>
  
**Typing Test:** <br>
  - Can Select Time Duration (1,2,3 minutes) <br>
  - Typing with live accuracy and WPM display <br>

**WPM History & Chart:** <br>
  - Only visible to logged-in User<br>
  - Displays top 5 highest scores and average WPM <br>
  - Line Chart to visualize WPM progress over time (Chart.js)

## Installations

1. Clone the repository: <br>
```bash
git clone https://github.com/abhisheksth9/Speed-Typing-Test.git
cd Speed-Typing-Test
```

2. Install Dependencies: <br>
```bash
pip install flask flask-login flask-sqlalchemy flask-bcrypt
```

3. Run the app: <br>
```bash
python app.py
```
Then open your browser and visit: http://127.0.0.1:5000
