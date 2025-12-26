import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Resource {
  _id: string;
  name: string;
  url: string;
}

interface ResourcesPanelProps {
  resources: Resource[];
}

export default function ResourcesPanel({ resources }: ResourcesPanelProps) {
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);

  const handleViewPdf = (url: string) => {
    setViewingPdf(url);
  };

  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Course Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resources.map((resource) => (
            <div
              key={resource._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{resource.name}</p>
                  <p className="text-xs text-gray-500">PDF Document</p>
                </div>
              </div>
              <button
                onClick={() => handleViewPdf(resource.url)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!viewingPdf} onOpenChange={() => setViewingPdf(null)}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Course Material</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {viewingPdf && (
              <iframe
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${viewingPdf}`}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
