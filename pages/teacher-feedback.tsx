import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getAllTeacherVettingFeedback } from '@/utils/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FolderOpen, CheckCircle, XCircle, Clock, Star } from 'lucide-react';

interface FeedbackData {
  id: string;
  folder_name: string;
  state?: string;
  subject?: string;
  grade?: string;
  domain?: string;
  topic?: string;
  instructure_code?: string;
  display_standard_code?: string;
  description?: string;
  quiz_id: string;
  quiz_title?: string;
  quiz_type?: string;
  num_questions?: number;
  variety_tag?: string;
  score?: number;
  approved?: boolean;
  usability?: number;
  standards_alignment?: number;
  jtbd?: string;
  feedback?: string;
  reviewer_name?: string;
  vetting_status?: string;
  created_at: string;
  updated_at: string;
}

interface FolderMetrics {
  folderName: string;
  totalResources: number;
  reviewed: number;
  approved: number;
  rejected: number;
  pending: number;
}

export default function TeacherFeedback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderMetrics, setFolderMetrics] = useState<FolderMetrics[]>([]);
  const [overallMetrics, setOverallMetrics] = useState({
    totalResources: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
    pending: 0
  });
  const tableRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllTeacherVettingFeedback();
      setFeedbackData(data);
      
      // Calculate overall metrics
      const totalResources = data.length;
      const reviewed = data.filter(item => item.vetting_status === 'reviewed').length;
      const approved = data.filter(item => item.approved === true).length;
      const rejected = data.filter(item => item.approved === false).length;
      const pending = data.filter(item => item.vetting_status === 'pending' || item.vetting_status === null).length;
      
      setOverallMetrics({
        totalResources,
        reviewed,
        approved,
        rejected,
        pending
      });
      
      // Calculate folder-specific metrics
      const folderMap = new Map<string, FolderMetrics>();
      
      data.forEach(item => {
        const folderName = item.folder_name;
        
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, {
            folderName,
            totalResources: 0,
            reviewed: 0,
            approved: 0,
            rejected: 0,
            pending: 0
          });
        }
        
        const metrics = folderMap.get(folderName)!;
        metrics.totalResources++;
        
        if (item.vetting_status === 'reviewed') {
          metrics.reviewed++;
        }
        
        if (item.approved === true) {
          metrics.approved++;
        } else if (item.approved === false) {
          metrics.rejected++;
        }
        
        if (item.vetting_status === 'pending' || item.vetting_status === null) {
          metrics.pending++;
        }
      });
      
      setFolderMetrics(Array.from(folderMap.values()).sort((a, b) => a.folderName.localeCompare(b.folderName)));
      
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedFolderData = () => {
    if (!selectedFolder) return [];
    return feedbackData.filter(item => item.folder_name === selectedFolder);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalIcon = (approved?: boolean) => {
    if (approved === true) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (approved === false) return <XCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">-</span>;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Teacher Feedback - HQRL Resources</title>
          <meta name="description" content="Teacher vetting feedback analytics and data" />
          <link rel="icon" href="/books.png" />
        </Head>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading feedback data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Teacher Feedback - HQRL Resources</title>
          <meta name="description" content="Teacher vetting feedback analytics and data" />
          <link rel="icon" href="/books.png" />
        </Head>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchFeedbackData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Teacher Feedback - HQRL Resources</title>
        <meta name="description" content="Teacher vetting feedback analytics and data" />
        <link rel="icon" href="/books.png" />
      </Head>
      <ErrorBoundary>
        <Navigation />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Feedback Dashboard</h1>
              <p className="text-gray-600">View and analyze teacher vetting feedback across all resources</p>
            </div>

            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overallMetrics.totalResources}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">Reviewed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{overallMetrics.reviewed}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{overallMetrics.approved}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{overallMetrics.rejected}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{overallMetrics.pending}</div>
                </CardContent>
              </Card>
            </div>

            {/* Folder Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Folder</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folderMetrics.map((folder) => (
                  <Card 
                    key={folder.folderName} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedFolder === folder.folderName ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedFolder(folder.folderName);
                      // Auto-scroll to table after a short delay to ensure it's rendered
                      setTimeout(() => {
                        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <FolderOpen className="h-4 w-4 mr-2" />
                        {folder.folderName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{folder.totalResources}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Approved:</span>
                          <span className="font-medium text-green-600">{folder.approved}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Rejected:</span>
                          <span className="font-medium text-red-600">{folder.rejected}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-medium text-gray-600">{folder.pending}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Feedback Table */}
            {selectedFolder && (
              <Card ref={tableRef}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Feedback Data for: {selectedFolder}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Quiz</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Approved</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Usability</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Standards</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSelectedFolderData().map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">
                                  <a 
                                    href={`http://wayground.com/admin/quiz/${item.quiz_id}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {item.quiz_title || `Quiz ${item.quiz_id.substring(0, 8)}...`}
                                  </a>
                                </div>
                                <div className="text-gray-500 text-xs">
                                  <a 
                                    href={`http://wayground.com/admin/quiz/${item.quiz_id}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-500 hover:text-gray-700 hover:underline"
                                  >
                                    {item.quiz_id}
                                  </a>
                                </div>
                                {item.num_questions && (
                                  <div className="text-gray-500 text-xs">
                                    {item.num_questions} questions
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {getApprovalIcon(item.approved)}
                                <span className="ml-2 text-sm">
                                  {item.approved === true ? 'Yes' : item.approved === false ? 'No' : 'Pending'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {renderStarRating(item.usability)}
                            </td>
                            <td className="py-3 px-4">
                              {renderStarRating(item.standards_alignment)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="max-w-2xl">
                                {item.jtbd && (
                                  <div className="mb-3">
                                    <span className="font-medium text-sm text-gray-600">JTBD:</span>
                                    <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{item.jtbd}</div>
                                  </div>
                                )}
                                {item.feedback && (
                                  <div>
                                    <span className="font-medium text-sm text-gray-600">Feedback:</span>
                                    <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{item.feedback}</div>
                                  </div>
                                )}
                                {!item.jtbd && !item.feedback && (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {getSelectedFolderData().length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No feedback data found for this folder.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!selectedFolder && (
              <Card>
                <CardContent className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Folder</h3>
                  <p className="text-gray-600">Choose a folder from the list above to view detailed feedback data.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </>
  );
} 