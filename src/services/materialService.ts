import { StudyMaterial } from '../types';
import { storageService } from './storageService';
import { FirestoreCollection } from './dbHelper';

const INITIAL_MATERIALS: StudyMaterial[] = [];

const materialStore = new FirestoreCollection<StudyMaterial>('materials', INITIAL_MATERIALS);

export const materialService = {
  async getMaterials(subjectId?: string): Promise<StudyMaterial[]> {
    const all = await materialStore.getAll();
    return subjectId ? all.filter(m => m.subjectId === subjectId) : all;
  },

  async uploadMaterial(data: Partial<StudyMaterial>, file?: File): Promise<StudyMaterial> {
    const id = data.id || `mat-${Date.now()}`;
    let fileUrl = data.url || '';
    let fileName = data.fileName || '';
    let size = data.size || '';

    if (file) {
      fileUrl = await storageService.uploadFile(`materials/${data.subjectId || 'general'}/${Date.now()}_${file.name}`, file);
      fileName = file.name;
      size = (file.size / 1024).toFixed(1) + ' KB';
    }

    const material: StudyMaterial = {
      id,
      title: data.title || 'New Study Material',
      subjectId: data.subjectId || 'sub-1',
      subjectName: data.subjectName || 'Data Structures',
      type: (data.type as any) || (fileName.endsWith('.ppt') || fileName.endsWith('.pptx') ? 'ppt' : fileName.endsWith('.docx') ? 'docx' : 'pdf'),
      url: fileUrl,
      fileName,
      size,
      uploadedBy: data.uploadedBy || 'Faculty Member',
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    return materialStore.add(material);
  },

  async createMaterial(data: Partial<StudyMaterial>, file?: File): Promise<StudyMaterial> {
    return this.uploadMaterial(data, file);
  },

  async deleteMaterial(id: string): Promise<void> {
    return materialStore.remove(id);
  }
};
