import Point from "./src/shapes/Point.js";
import Circle from "./src/shapes/Circle.js";
import Square from "./src/shapes/Square.js";
import Line from "./src/shapes/Line.js";
import Rect from "./src/shapes/Rect.js";
import Ellipse from "./src/shapes/Ellipse.js";

// References------------------------------------
const inputSnapSize = document.getElementById('snapSize');
const tools = document.querySelector('.tools');

window.addEventListener('resize', _ => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  offset.update(0, 0);
});

// Global variables--------------------------------
function Unit(v) {
  return {
    default: v,
    mini: 35,
    maxi: 250,
    size: v,
    setSize(v) {
      this.size = v;
    },
    updateSize(v) {
      this.size = Util.clamp(this.size + v, this.mini, this.maxi);
    },
  }
}
const unit = Unit(100);

const board = new Board(canvas);
const cursor = new Cursor(canvas);
const offset = new Offset(canvas);
offset.update(0, 0);

let SNAP = inputSnapSize.value;

let shapes = [];

// Default Functions--------------------------------
function update(dt) {
  Util.reset(ctx, offset);
  offset.update(0, 0);
  board.update(offset, unit.size);
  cursor.update(dt);
  shapes.forEach(shape => {
    shape.update(dt, unit.size);
  });
}

function draw() {
  board.draw(offset, unit.size);
  shapes.forEach(shape => {
    shape.draw();
  });
  cursor.draw(unit.size);
}

function clear() {
  ctx.clearRect(-offset.x, -offset.y, canvas.width, canvas.height);
}

let oldTimeStamp = 0;
let dt = 0;
function mainLoop(timeStamp) {
  dt = Math.min((timeStamp - oldTimeStamp) / 1000, 0.1);
  oldTimeStamp = timeStamp;

  update(dt);
  clear();
  draw();

  requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

// Events--------------------------------------------
function updateValue(s) {
  let shape = { ...s };
  const el = document.getElementById("circleHtml");
  const child = el.children;
  child.x.addEventListener("change", (e) => {
    shape.x = e.target.value;
    console.log(shape);
  });
  return shape;
}

function addCircleHtml(shape) {
  let { a, r } = shape;
  let { x, y } = a;
  document.getElementById("rectangleHtml").style.display = "none";
  const el = document.getElementById("circleHtml");
  el.style.display = "grid";
  const child = el.children;
  child.x.value = x;
  child.y.value = y;
  child.r.value = r;
}

function addRectangleHtml(shape) {
  let { x, y, w, h } = shape;
  const el = document.getElementById("rectangleHtml");
  el.style.display = "grid";
  document.getElementById("circleHtml").style.display = "none";
  const child = el.children;
  child.x.value = x;
  child.y.value = y;
  child.w.value = w;
  child.h.value = h;
}

let x, y;
let canMove = false;
let clicked = false;
let isDrawing = false;
let drawManager = 'select';
let tempShape = {};

function pointCircle(px, py, cx, cy, cr) {
  return cr ** 2 > (px - cx) ** 2 + (py - cy) ** 2;
}

function pointRect(px, py, rx, ry, rw, rh) {
  if ((px > rx && px < rx + rw) && (py > ry && py < ry + rh)) {
    return true;
  }
  return false;
}

function pointPoint() {

}

function pointLine() {

}

let option = {
  line: (x, y) => new Line(ctx, x, y, x, y),
  circle: (x, y) => new Circle(ctx, x, y),
  rect: (x, y) => new Rect(ctx, x, y),
  point: (x, y) => new Point(ctx, x, y),
  ellipse: (x, y) => new Ellipse(ctx, x, y),
  square: (x, y) => new Square(ctx, x, y),
}
canvas.addEventListener('mousedown', e => {
  // middle button canvas movement
  if (e.button == 1) {
    canMove = true;
    e.preventDefault();
  }

  // primary button
  if (e.button == 0) {
    let x = e.offsetX - offset.x;
    let y = e.offsetY - offset.y;
    [x, y] = Util.snapXY(x, y, unit.size, SNAP);
    switch (drawManager) {
      case "select":
        for (const shape of shapes) {
          shape.selected = false;
        }
        for (const shape of shapes) {
          console.log(shape);
          if (shape.type == "circle" && pointCircle(x, y, shape.a.x, shape.a.y, shape.r)) {
            shape.selected = true;
            addCircleHtml(shape);
            break;
          }
          if (shape.type == "square" && pointRect(x, y, shape.a.x, shape.a.y, shape.w, shape.h)) {
            shape.selected = true;
            addRectangleHtml(shape);
            console.log("clicked square");
            break;
          }
        }
        break;

      case "point":
        shapes.push(new Point(ctx, x, y));
        isDrawing = true;
        break;

      case "line":
        shapes.push(new Line(ctx, x, y, x + 1, y));
        isDrawing = true;
        break;

      case "circle":
        isDrawing = true;
        shapes.push(new Circle(ctx, x, y));
        break;

      case "ellipse":
        shapes.push(new Ellipse(ctx, x, y));
        isDrawing = true;
        break;

      case "rect":
        shapes.push(new Rect(ctx, x, y));
        isDrawing = true;
        break;

      case "square":
        shapes.push(new Square(ctx, x, y));
        isDrawing = true;
        break;
    }
    // if (drawManager != "select") {
    //     let a = option[drawManager];
    //     tempShape = a(x, y);
    //     tempShape.selected = true;
    //     shapes.push(tempShape);
    // }
    clicked = true;
  }
});

canvas.addEventListener('mousemove', e => {
  if (canMove) {
    offset.update(e.movementX, e.movementY);
  }
  let x = e.offsetX - offset.x;
  let y = e.offsetY - offset.y;
  [x, y] = Util.snapXY(x, y, unit.size, SNAP);
  cursor.setPos(x, y);
  if (isDrawing && (shapes.at(-1).v[0].x != x || shapes.at(-1).v[0].y != y)) {
    shapes.at(-1).updateSize(x, y);
  }
});

window.addEventListener('mouseup', e => {
  canMove = false;
  if (e.button == 0) {
    clicked = false;
    isDrawing = false;
  }
});

canvas.addEventListener('mouseleave', e => {
  cursor.setPos(0, 0);
});

window.addEventListener('wheel', e => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('wheel', e => {
  let zoomSpeed = (unit.size >= 70) ? 20 : 50;
  let moveSpeed = (unit.size <= 70) ? 5 : 20;
  let zoom = -e.deltaY / zoomSpeed;
  let move = -e.deltaY / moveSpeed;
  if (e.ctrlKey) {
    e.preventDefault();
    unit.updateSize(zoom);
    offset.update(0, 0);
  }
  else if (!canMove) {
    if (e.shiftKey) {
      offset.update(move, 0);
    } else {
      offset.update(0, move);
    }
  }
  let x = e.offsetX - offset.x;
  let y = e.offsetY - offset.y;
  [x, y] = Util.snapXY(x, y, unit.size, SNAP);
  cursor.setPos(x, y);
}, { passive: false });

window.addEventListener('keydown', e => {
  if (e.ctrlKey) e.preventDefault();
  if (e.code == 'KeyC' && !e.ctrlKey) {
    offset.set(canvas.width / 2, canvas.height / 2)
  }
  if (e.code == 'KeyC' && e.ctrlKey) {
    unit.setSize(unit.default);
  }
}, { passive: false });

inputSnapSize.addEventListener('change', e => {
  SNAP = e.target.value;
});

tools.addEventListener('click', (e) => {
  drawManager = e.target.dataset.tool;
  let toolList = tools.children;
  for (const tool of toolList) {
    if (drawManager == tool.dataset.tool) {
      tool.style.backgroundColor = 'black';
      tool.style.color = 'white';
    } else {
      tool.style.backgroundColor = '';
      tool.style.color = '';
    }
  }
});