from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')


# Route pour Beach Volleyball
@app.route('/volleyball')
def volleyball():
    return render_template('volleyball.html')

# Route pour Camping Pac-Man
@app.route('/pacman')
def pacman():
    return render_template('pacman.html')

# Route pour Tir à l'Arc


@app.route('/base')
def base():
    return render_template('base.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
