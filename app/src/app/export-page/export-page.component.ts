import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'export-page',
  templateUrl: './export-page.component.html',
  styleUrls: ['./export-page.component.css']
})
export class ExportPageComponent implements OnInit {
  exportStatus: string = '';
  isExporting: boolean = false;
  collections = ['interactions', 'questions', 'responses', 'insights'];

  constructor(
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit(): void {}

  async exportFirestoreData() {
    try {
      this.isExporting = true;
      this.exportStatus = 'Starting export...';
      
      const exportData: any = {};

      for (const collectionName of this.collections) {
        this.exportStatus = `Exporting ${collectionName}...`;
        const snapshot = await this.firestore.collection(collectionName).get().toPromise();
        exportData[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Create a blob with the data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `firestore_export_${timestamp}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.exportStatus = 'Export completed successfully!';
    } catch (error) {
      console.error('Error exporting data:', error);
      this.exportStatus = `Error: ${error.message}`;
    } finally {
      this.isExporting = false;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
} 