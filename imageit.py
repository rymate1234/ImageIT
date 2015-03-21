import string, random, os
import imghdr
from sqlite3 import dbapi2 as sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash, send_from_directory


# create our little application :)
app = Flask(__name__)

# Load default config and override config from an environment variable
app.config.update(dict(
    DATABASE='/home/rymate/imageit/images.db',
    DEBUG=True,
    UPLOAD_FOLDER='/home/rymate/imageit/images',
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024,
))

app.config.from_envvar('FLASKR_SETTINGS', silent=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def connect_db():
    """Connects to the specific database."""
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv


def init_db():
    """Creates the database tables."""
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()


def get_db():
    """Opens a new database connection if there is none yet for the
current application context.
"""
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

@app.teardown_appcontext
def close_db(error):
    """Closes the database again at the end of the request."""
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        file = request.files['fileInput']
        title = ""
        image_type = imghdr.what(file)
        if file:
            if not image_type:
                print "Not an image gtfo"
                return render_template('index.html', error="Something was wrong with your file, make sure it's an image")
            else:
                print "Ok saving lel"
                file_id = id_generator()
                file_ext = file.filename.rsplit('.', 1)[1]
                filename = file_id + "." + file_ext
                db = get_db()
                db.execute('insert into entries (file_name, title, file_ext) values (?, ?, ?)',
                     [file_id, "", file_ext])
                db.commit()
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                return redirect("/images/" + filename)
        else:
            return render_template('index.html', error="It looks like you forgot to choose a file to upload. ")
    else:
        return render_template('index.html')

@app.route('/view/<id>')
def view_image(id):    
    image = query_db('select * from entries where file_name = ?',
                [id], one=True) 
    return render_template('view.html', image = image) 

@app.route('/about')
def about():    
    return render_template('about.html') 

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/uploaded')
def uploaded():
    return render_template('uploaded.html')

@app.route('/images/<filename>')
def direct_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/get-filename/<id>')
def image_filename(id):
    image = query_db('select * from entries where file_name = ?',
                [id], one=True)
    return image[1] + "." + image[3]

@app.route('/upload', methods=['POST']) 
def upload():
    if request.method == 'POST':
        file = request.data
        if file:
            file_id = id_generator()
            file_ext = "png"
            print "test"
            filename = file_id + "." + file_ext
            db = get_db()
            print "test"
            db.execute('insert into entries (file_name, title, file_ext) values (?, ?, ?)',
                 [file_id, "", file_ext])
            print "test"
            db.commit()
            image = open(os.path.join(app.config['UPLOAD_FOLDER'], filename), 'w+')
            image.write(request.data)
            image.close()
            print "Uploaded as " + os.path.join(app.config['UPLOAD_FOLDER'], filename)
            return file_id
        else:
            return "NO FILE"

def id_generator(size=7, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for x in range(size))

if __name__ == '__main__':
    connect_db()
    app.run(host='0.0.0.0')
