from flask import Flask, render_template, request, redirect, url_for, flash
from flask_login import UserMixin, LoginManager, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ''

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy()
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

class Users(db.Model, UserMixin):
    SN = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name = db.Column(db.String(64), nullable=False)
    Username = db.Column(db.String(30), unique=True, nullable=False)
    Email = db.Column(db.String(50), nullable=False)
    Password = db.Column(db.String(30), nullable=False)
    HighScore = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<User {self.Username} - High Score: {self.HighScore}'
    
    def check_password(self, password):
        return bcrypt.check_password(self.Password, password)

@login_manager.user_loader
def load_user(user_id):
    return Users.query.get(int(user_id))

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = Users.query.filter_by(Username=username).first()
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
        name = request.form['name']
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        existing_user = Users.query.filter((Users.Username == username) | (Users.Email == email)).first()
        if existing_user:
            flash('Username or email already exists', 'warning')
            return redirect(url_for('signup'))
        
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = Users(Name=name, Username=username, Email=email, Password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()
        flash('Account created successfully! Please Log in.', 'success')
        return redirect(url_for('login.html'))
    
    return render_template('signup.html')

if __name__ == "__main__":
    app.run(debug = True)