import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
  className?: string;
}

export default function FileUploader({ onFileSelect, loading = false, className }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      onFileSelect(csvFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            loading && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            {loading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            )}
            
            <h3 className="text-lg font-semibold mb-2">
              {loading ? 'Processing...' : 'Upload CSV File'}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              {loading 
                ? 'Please wait while we process your file'
                : 'Drag and drop your CSV file here, or click to browse'
              }
            </p>

            

            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              disabled={loading}
              className="hidden"
              id="file-upload"
            />
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="default" 
                disabled={loading}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {loading ? 'Processing...' : 'Browse Files'}
              </Button>
              
              <Button 
                variant="secondary" 
                disabled={loading}
                onClick={() => window.open('https://docs.google.com/spreadsheets/d/131gmcV-isMGIP3wZzGZ5_u7cSJqXh8596LFGU9xZQrM/copy', '_blank')}
              >
                Duplicate Template
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">How to use:</h4>
          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <span>Make a copy of the Google Sheets template.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span>Add the data in the Google Sheet and download it as a CSV.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span>Upload the CSV here.</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 