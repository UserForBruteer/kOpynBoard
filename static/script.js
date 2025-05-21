const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const socket = io();

let drawing = false;
let lastX = 0, lastY = 0;
let author_id = null;

let my_strokes = {}; // id -> {x1, y1, x2, y2, color, width, author_id}

socket.on('assign_id', id => {
  author_id = id;
});

socket.on('load_canvas', data => {
  for (let d of data) drawLine(d);
});

canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const x = e.offsetX;
  const y = e.offsetY;
  const stroke = {
    x1: lastX, y1: lastY,
    x2: x, y2: y,
    color: 'black',
    width: 2,
    author_id,
    id: crypto.randomUUID()
  };
  socket.emit('draw', stroke);
  my_strokes[stroke.id] = stroke;
  drawLine(stroke);
  [lastX, lastY] = [x, y];
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  // стирание ближайшего твоего штриха (для простоты)
  for (let id in my_strokes) {
    socket.emit('erase', { id, author_id });
    delete my_strokes[id];
    break;
  }
});

socket.on('draw', drawLine);
socket.on('erase', data => {
  // простейшее "очистить всё и перерисовать"
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('load_canvas'); // попросим сервер снова отдать
});

function drawLine(d) {
  ctx.strokeStyle = d.color;
  ctx.lineWidth = d.width;
  ctx.beginPath();
  ctx.moveTo(d.x1, d.y1);
  ctx.lineTo(d.x2, d.y2);
  ctx.stroke();
}
