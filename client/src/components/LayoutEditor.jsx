import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Square, Circle, Save, Trash2, Armchair, Check } from 'lucide-react';

export default function LayoutEditor({ initialData, onSave }) {
    const canvasRef = useRef(null);
    const lastSavedRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [showGuides, setShowGuides] = useState(false);
    const [selectedObject, setSelectedObject] = useState(null);
    const [labelText, setLabelText] = useState('');
    const [savedFeedback, setSavedFeedback] = useState(false);

    useEffect(() => {
        const c = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 1000,
            backgroundColor: '#020617',
        });
        setCanvas(c);

        c.on('selection:created', (e) => handleSelection(e.selected?.[0]));
        c.on('selection:updated', (e) => handleSelection(e.selected?.[0]));
        c.on('selection:cleared', () => {
            setSelectedObject(null);
            setLabelText('');
        });

        return () => {
            c.dispose();
        };
    }, []);

    // Load initialData when canvas is ready or initialData arrives asynchronously
    useEffect(() => {
        if (!canvas || !initialData) return;
        const serialized = typeof initialData === 'string' ? initialData : JSON.stringify(initialData);
        if (serialized === lastSavedRef.current) return;

        let cancelled = false;
        const loadLayout = async () => {
            try {
                const parsed = typeof initialData === 'string' ? JSON.parse(initialData) : initialData;
                await canvas.loadFromJSON(parsed);
                if (!cancelled) {
                    canvas.getObjects().forEach(obj => {
                        if (obj.isGuide) canvas.remove(obj);
                    });
                    canvas.requestRenderAll();
                }
            } catch (err) {
                console.error('Error loading layout JSON:', err);
            }
        };
        loadLayout();
        return () => { cancelled = true; };
    }, [canvas, initialData]);

    // Support Delete/Backspace keyboard shortcut
    useEffect(() => {
        if (!canvas) return;
        const handleKeyDown = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = canvas.getActiveObjects();
                if (activeObjects.length > 0) {
                    e.preventDefault();
                    activeObjects.forEach(obj => {
                        if (!obj.isGuide) canvas.remove(obj);
                    });
                    canvas.discardActiveObject();
                    setSelectedObject(null);
                    setLabelText('');
                    canvas.requestRenderAll();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvas]);

    // Toggle Symmetry Guides
    useEffect(() => {
        if (!canvas) return;
        const objects = [...canvas.getObjects()];
        objects.forEach(obj => {
            if (obj.isGuide) canvas.remove(obj);
        });

        if (showGuides) {
            const lineV = new fabric.Line([500, 0, 500, 600], {
                stroke: 'rgba(255,0,0,0.3)',
                selectable: false,
                evented: false,
                strokeDashArray: [5, 5]
            });
            lineV.isGuide = true;

            const lineH = new fabric.Line([0, 300, 1000, 300], {
                stroke: 'rgba(255,0,0,0.3)',
                selectable: false,
                evented: false,
                strokeDashArray: [5, 5]
            });
            lineH.isGuide = true;

            canvas.add(lineV, lineH);
        }
        canvas.requestRenderAll();
    }, [showGuides, canvas]);

    const handleSelection = (obj) => {
        if (!obj) return;
        setSelectedObject(obj);
        if (typeof obj.getObjects === 'function') {
            const textObj = obj.getObjects().find(o => o.type?.toLowerCase() === 'text' || o.type?.toLowerCase() === 'i-text');
            setLabelText(textObj ? textObj.text : (obj.seatLabel || ''));
        } else {
            setLabelText(obj.seatLabel || '');
        }
    };

    const updateLabel = (text) => {
        setLabelText(text);
        if (!selectedObject || !canvas) return;

        if (typeof selectedObject.getObjects === 'function') {
            const textObj = selectedObject.getObjects().find(o => o.type?.toLowerCase() === 'text' || o.type?.toLowerCase() === 'i-text');
            if (textObj) {
                textObj.set('text', text);
                selectedObject.set('seatLabel', text);
                selectedObject.set('dirty', true);
                if (typeof selectedObject.triggerLayout === 'function') {
                    selectedObject.triggerLayout();
                }
                canvas.requestRenderAll();
                return;
            }
        }
        selectedObject.set('seatLabel', text);
        canvas.requestRenderAll();
    };

    const getNextSeatLabel = () => {
        if (!canvas) return 'A1';
        const existingLabels = new Set(
            canvas.getObjects()
                .map(o => o.seatLabel)
                .filter(Boolean)
        );
        let index = 1;
        while (existingLabels.has(`A${index}`)) {
            index++;
        }
        return `A${index}`;
    };

    const addChair = () => {
        if (!canvas) return;
        const nextLabel = getNextSeatLabel();
        const circle = new fabric.Circle({
            radius: 14,
            fill: '#cbd5e1',
            stroke: '#475569',
            strokeWidth: 1.5,
            originX: 'center',
            originY: 'center'
        });

        const text = new fabric.Text(nextLabel, {
            fontSize: 10,
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            fill: '#0f172a'
        });

        const group = new fabric.Group([circle, text], {
            left: 150,
            top: 150,
            seatLabel: nextLabel
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
    };

    const addRectTable = () => {
        if (!canvas) return;
        const rect = new fabric.Rect({
            left: 100, top: 100, fill: '#a5b4fc', width: 70, height: 70, stroke: '#4338ca', strokeWidth: 2, rx: 6, ry: 6
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.requestRenderAll();
    };

    const addRoundTable = () => {
        if (!canvas) return;
        const circle = new fabric.Circle({
            radius: 38, fill: '#fca5a5', left: 100, top: 100, stroke: '#b91c1c', strokeWidth: 2
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        canvas.requestRenderAll();
    };

    const deleteSelected = () => {
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach(obj => {
                if (!obj.isGuide) canvas.remove(obj);
            });
            canvas.discardActiveObject();
            setSelectedObject(null);
            setLabelText('');
            canvas.requestRenderAll();
        }
    };

    const handleSave = () => {
        if (!canvas) return;
        const raw = canvas.toObject(['seatLabel', 'isGuide']);
        if (Array.isArray(raw.objects)) {
            raw.objects = raw.objects
                .filter(o => !o.isGuide)
                .map(({ isGuide: _ignored, ...rest }) => rest);
        }
        const json = JSON.stringify(raw);
        lastSavedRef.current = json;
        onSave(json);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2500);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 p-2 bg-slate-800 rounded-xl border border-slate-700 items-center">
                <button type="button" onClick={addRectTable} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600">
                    <Square className="h-4 w-4 mr-2 text-indigo-400" /> Mesa Cuadrada
                </button>
                <button type="button" onClick={addRoundTable} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600">
                    <Circle className="h-4 w-4 mr-2 text-red-400" /> Mesa Redonda
                </button>
                <button type="button" onClick={addChair} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600">
                    <Armchair className="h-4 w-4 mr-2 text-slate-400" /> Silla
                </button>

                <div className="h-8 w-px bg-slate-600 mx-2"></div>

                <label className="flex items-center text-slate-300 text-sm gap-2 cursor-pointer bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                    <input type="checkbox" checked={showGuides} onChange={e => setShowGuides(e.target.checked)} className="rounded border-slate-500 bg-slate-800 text-indigo-500" />
                    Ejes Simetría
                </label>

                <div className="flex-1"></div>

                {selectedObject && (
                    <div className="flex items-center gap-2 bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-500/30">
                        <span className="text-xs text-indigo-300 uppercase font-bold">Etiqueta:</span>
                        <input
                            type="text"
                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs w-20"
                            value={labelText}
                            onChange={e => updateLabel(e.target.value)}
                        />
                    </div>
                )}

                <button type="button" onClick={deleteSelected} className="flex items-center px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </button>
                <button type="button" onClick={handleSave} className={`flex items-center px-4 py-2 rounded-lg shadow-lg font-medium transition-all ${savedFeedback ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'}`}>
                    {savedFeedback ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {savedFeedback ? 'Mapa Aplicado' : 'Aplicar Mapa'}
                </button>
            </div>

            <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-900">
                <div className="bg-slate-800 text-slate-400 text-xs px-2 py-1 flex justify-between">
                    <span>Lienzo de Diseño</span>
                    <span>1000 x 600 px</span>
                </div>
                {/* Canvas wrapper to center it if needed, or scroll */}
                <div className="overflow-auto max-h-[600px] bg-slate-900/50 flex justify-center p-4">
                    <canvas ref={canvasRef} />
                </div>
            </div>
            <p className="text-sm text-slate-400 text-center">
                Arrastra y suelta los elementos. Selecciona un objeto y presiona "Eliminar" para borrarlo.
            </p>
        </div>
    );
}

