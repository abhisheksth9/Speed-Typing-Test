from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import UserMixin, LoginManager, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///Users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

class Users(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name = db.Column(db.String(64), nullable=False)
    Username = db.Column(db.String(30), unique=True, nullable=False)
    Email = db.Column(db.String(50), unique=True, nullable=False)
    Password = db.Column(db.String(128), nullable=False)
    HighScore = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<User {self.Username} - High Score: {self.HighScore}>'

    def check_password(self, password):
        return bcrypt.check_password_hash(self.Password, password)

class Scores(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return Users.query.get(int(user_id))

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = Users.query.filter((Users.Username == username) | (Users.Email == username)).first()
        if user and user.check_password(password):
            login_user(user)
            flash('Login Successful!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'danger')
    return render_template('login.html')

@app.route("/signup", methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form.get('name')
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        existing_user = Users.query.filter((Users.Username == username) | (Users.Email == email)).first()
        if existing_user:
            flash('Username or email already exists', 'warning')
            return redirect(url_for('signup'))

        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = Users(Name=name, Username=username, Email=email, Password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()
        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route("/score", methods=['POST'])
@login_required
def save_score():
    new_score = int(request.form['score'])
    score_entry = Scores(user_id=current_user.id, score=new_score)
    db.session.add(score_entry)
    db.session.commit()

    current_top_score = db.session.query(Scores.score).filter_by(user_id=current_user.id).order_by(Scores.score.desc()).first()
    if current_top_score:
        current_user.HighScore = current_top_score[0]
        db.session.commit()

    print(f"Saving score: {new_score} for user ID: {current_user.id}")
    return jsonify({"message": "Score saved and high scores updated!"}), 200

@app.route("/profile")
@login_required
def profile():
    top_scores = Scores.query.filter_by(user_id=current_user.id).order_by(Scores.score.desc()).limit(5).all()
    print("Top Scores fetched: ", top_scores)
    for s in top_scores:
        print(s.score)
    return render_template("profile.html", highscore=current_user.HighScore, top_scores=top_scores)

@app.route('/user/wpm-scores')
@login_required
def get_wpm_scores():
    scores = Scores.query.filter_by(user_id=current_user.id).order_by(Scores.id.asc()).all()
    score_data = [{'x': i + 1, 'y': score.score} for i, score in enumerate(scores)]
    return jsonify(score_data)

@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/get-paragraph')
def get_paragraph():
    import random
    with open('data/paragraphs.txt', 'r', encoding='utf-8') as file:
        paragraphs = [p.strip() for p in file.read().split('\n') if p.strip()]
    return jsonify({"content": random.choice(paragraphs)})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
