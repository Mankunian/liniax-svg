import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {CardModule} from "primeng/card";
import {Button} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {InputTextareaModule} from "primeng/inputtextarea";
import {StorageService} from "../../../../services/storage.service";
import {SelectButtonModule} from "primeng/selectbutton";
import {DropdownModule} from "primeng/dropdown";
import {MultiSelectModule} from "primeng/multiselect";

interface MockData {
  id: number,
  layerId: string,
  pointName: string,
  description: string,
  coordinateX: number,
  coordinateY: number
}

interface Layers {
  id: string,
  name: string,
}

interface Point {
  pointName: string,
  coordinateX: number,
  coordinateY: number,
  description: string,
  id: number,
  layerId: string
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    Button,
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    InputTextareaModule,
    SelectButtonModule,
    FormsModule,
    DropdownModule,
    MultiSelectModule,
    // Добавь этот импорт
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnInit {
  @ViewChild('svgContainer') svgContainer!: ElementRef;
  @ViewChild('transformGroup') transformGroup!: ElementRef;
  svgWidth = 800; // Размер SVG (подстрой под твои данные)
  svgHeight = 600;
  viewBox = '';
  defaultViewBox = '';
  points: Point[] = [];
  filteredPoints: Point[] = []; // Фильтрованные точки

  scale = 1;
  translateX = 0;
  translateY = 0;
  panX = 0;
  panY = 0;
  lastPanX = 0;
  lastPanY = 0;
  lastScale = 1;
  selectedPoint: MockData | null = null;
  visibleDialog = false;
  svgForm!: FormGroup;
  mockData: MockData[] = [];
  floorOptions: any[] = [
    {label: '1st floor', value: '1', img: '1.svg'},
    {label: '2nd floor', value: '2', img: '2.svg'},
    {label: '3rd floor', value: '3', img: '3.png'}
  ];
  selectedFloor: string = '1';
  planByFloorImage: string = 'assets/plan/1.svg';

  layers: Layers[] = [];
  selectedLayers: string[] = [];

  constructor(
    private storage: StorageService
  ) {
    this.viewBox = `0 0 ${this.svgWidth} ${this.svgHeight}`;
    this.defaultViewBox = this.viewBox;
  }

  ngAfterViewInit() {
    const hammer = new Hammer(this.svgContainer.nativeElement);

    hammer.get('pinch').set({enable: true});
    hammer.get('pan').set({direction: Hammer.DIRECTION_ALL});

    hammer.on('pinch', (event) => this.onPinch(event));
    hammer.on('pan', (event) => this.onPan(event));
    hammer.on('pinchend', () => this.onPinchEnd());
    hammer.on('panend', () => this.onPanEnd());

    this.svgContainer.nativeElement.addEventListener('wheel', (event: WheelEvent) => this.onWheel(event));


    setTimeout(() => {
      this.svgContainer.nativeElement.getBoundingClientRect(); // Принудительное обновление размеров
    }, 0);
  }

  onPinch(event: HammerInput) {
    this.scale = Math.max(0.5, Math.min(3, this.lastScale * event.scale));
    this.updateTransform();
  }

  onPinchEnd() {
    this.lastScale = this.scale;
  }

  onPan(event: HammerInput) {
    this.panX = this.lastPanX + event.deltaX;
    this.panY = this.lastPanY + event.deltaY;
    this.updateTransform();
  }

  onPanEnd() {
    this.lastPanX = this.panX;
    this.lastPanY = this.panY;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.max(0.5, Math.min(3, this.scale * zoomFactor));
    this.updateTransform();
  }

  updateTransform() {
    this.transformGroup.nativeElement.setAttribute(
      'transform',
      `translate(${this.panX}, ${this.panY}) scale(${this.scale})`
    );
  }

  onDoubleClick(event: MouseEvent) {
    event.preventDefault();
    this.addPoint(event);
  }

  ngOnInit(): void {
    this.initForm();
    this.getLayers();
    this.getMockData();
  }

  initForm() {
    this.svgForm = new FormGroup({
      coordinateX: new FormControl(null),
      coordinateY: new FormControl(null),
      id: new FormControl(null),
      pointName: new FormControl(null),
      description: new FormControl(null),
      layerId: new FormControl(null),
    })
  }

  getMockData() {
    this.mockData = this.storage.getItem('mockData') || [];

    if (!Array.isArray(this.mockData)) {
      this.mockData = []; // Защита от ошибок, если вдруг данные не массив
    }

    console.log(this.mockData);

    // Обновляем `points` для отрисовки точек в SVG
    this.points = this.mockData.map(item => ({
      coordinateX: item.coordinateX,
      coordinateY: item.coordinateY,
      pointName: item.pointName,
      description: item.description,
      layerId: item.layerId,
      id: item.id
    }))

    this.filterPoints(); // Фильтруем после загрузки
  }

  getLayers() {
    this.layers = [
      { id: 'cameras', name: 'Камеры' },
      { id: 'sensors', name: 'Датчики температуры' },
      { id: 'checkpoints', name: 'Контрольные точки' }
    ];
    this.selectedLayers = ['cameras']; // По умолчанию выбран один слой

  }

  addPoint(event: MouseEvent | TouchEvent) {
    const svg = this.svgContainer.nativeElement as SVGSVGElement;
    this.svgForm.reset();

    let clientX: number, clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent) {
      // Берем координаты первого касания
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      return;
    }

    // Создаем точку в системе координат окна
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    // Получаем матрицу трансформации SVG
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      console.warn("Не удалось получить CTM, используем приблизительные координаты.");
      return;
    }

    // Преобразуем координаты в систему SVG
    const svgPoint = point.matrixTransform(ctm.inverse());

    // Добавляем точку в список
    this.addPointToList(svgPoint.x, svgPoint.y);

    // Заполняем форму
    this.svgForm.patchValue({
      coordinateX: svgPoint.x,
      coordinateY: svgPoint.y,
      id: null,
      pointName: null,
      description: null,
      layerId: this.selectedLayers[0]
    });

    this.selectedPoint = this.svgForm.value;

    // Открываем модалку через 1 сек.
    setTimeout(() => {
      this.visibleDialog = true;
    }, 1000);
  }


  private addPointToList(x: number, y: number) {
    this.points = [...this.points, {description: "", id: 0, pointName: "", coordinateX: x, coordinateY: y, layerId: ''}];
  }

  showInfo(event: MouseEvent, point: any) {
    event.stopPropagation(); // Чтобы клик по точке не добавлял новую точку
    this.selectedPoint = point; // Сохраняем точку

    this.visibleDialog = true;
    this.bindForm();

  }

  bindForm() {
    this.svgForm.get('coordinateX')?.setValue(this.selectedPoint?.coordinateX);
    this.svgForm.get('coordinateY')?.setValue(this.selectedPoint?.coordinateY);
    this.svgForm.get('pointName')?.setValue(this.selectedPoint?.pointName);
    this.svgForm.get('description')?.setValue(this.selectedPoint?.description);
    this.svgForm.get('id')?.setValue(this.selectedPoint?.id);
  }

  saveNewPoint() {
    let mockData = this.storage.getItem('mockData') || []; // Загружаем данные

    if (!Array.isArray(mockData)) {
      mockData = []; // Если данные не массив, создаем новый
    }

    let newId = 0;
    if (mockData.length > 0) {
      const lastItem = mockData[mockData.length - 1];
      newId = lastItem.id + 1;
    }

    this.svgForm.get('id')?.setValue(newId);

    // Добавляем новый объект в массив
    mockData.push(this.svgForm.value);

    console.log(mockData)

    // Сохраняем обновленный массив
    this.storage.setItem('mockData', mockData);

    // Обновляем массив точек для отображения
    window.location.reload();
  }

  onSelectFloor() {
    const foundFloor = this.floorOptions.find(f => f.value === this.selectedFloor);
    this.planByFloorImage = `assets/plan/${foundFloor.img}`;

    //clear points
    this.points = [];

    setTimeout(() => {
      this.getMockData();
    }, 2000)
  }


  onResetSvg() {
    this.viewBox = this.defaultViewBox;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;

    // Сбрасываем transform, если используешь group (<g>)
    const svgElement = document.querySelector('#svgContainer g');
    if (svgElement) {
      (svgElement as SVGGElement).setAttribute('transform', '');
    }
  }

  filterPoints() {
    if (this.selectedLayers.length === 0) {
      this.filteredPoints = this.points;
    } else {
      this.filteredPoints = this.points.filter(point =>
        this.selectedLayers.some(layer => point.layerId.includes(layer))
      );
    }
  }

  getColor(layerId: string): string {
    const colors = ['#FF5733', '#33FF57', '#3357FF']; // Три случайных цвета
    const index = Math.abs(this.hashCode(layerId)) % colors.length;
    return colors[index];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }



}
