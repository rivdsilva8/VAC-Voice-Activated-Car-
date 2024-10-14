from flask import Flask, render_template
from flask_socketio import SocketIO, emit  # Import emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", transports=['polling'])

# Basic route for the Flask server
@app.route('/')
def index():
    return render_template('index.html')

# Socket.IO event listener for client connections
@socketio.on('command')  # Ensure this matches the client event
def handle_command(cmd):
    print(f'Received command: {cmd}')
    # process the command
    #sort into command bucket
    response = f'Server recieved: {cmd}'  # Prepare response
    emit('response', response)  # Emit the response back to the client

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)
