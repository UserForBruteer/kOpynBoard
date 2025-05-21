from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

draw_data = []  # [{x1, y1, x2, y2, color, width, author_id}]

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    session_id = str(uuid.uuid4())
    emit('assign_id', session_id)
    emit('load_canvas', draw_data)

@socketio.on('draw')
def handle_draw(data):
    draw_data.append(data)
    emit('draw', data, broadcast=True)

@socketio.on('erase')
def handle_erase(data):
    author_id = data.get('author_id')
    global draw_data
    draw_data = [d for d in draw_data if not (
        d['author_id'] == author_id and d['id'] == data['id']
    )]
    emit('erase', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
