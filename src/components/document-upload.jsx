import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DocumentUpload({
  label,
  documentType,
  value,
  onChange,
  required,
  helperText,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div>
      <Label className="text-foreground mb-2 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {!value ? (
        <div
          onDragOver={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed transition-colors p-6 text-center cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*,.pdf"
          />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">
            Seret file atau klik untuk upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Format: JPG, PNG, atau PDF (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg border-2 border-primary bg-primary/5 p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Dokumen berhasil diunggah
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {documentType}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-xs text-muted-foreground mt-2">{helperText}</p>
      )}
    </div>
  );
}
