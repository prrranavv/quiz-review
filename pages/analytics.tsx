import React, { useState, useEffect } from 'react';
import { getAllFeedback } from '@/utils/supabase';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { CalendarDays, Filter, TrendingUp, Download, MessageSquare, BarChart3, ChevronLeft, ChevronRight, Check, ChevronsUpDown, Brain, Loader2 } from 'lucide-react';

interface FeedbackData {
  id: string;
  folder_name: string;
  domain: string | null;
  topic: string | null;
  standard: string;
  quiz_id: string;
  thumbs_up: boolean | null;
  thumbs_down: boolean | null;
  standard_alignment_rating: number | null;
  quality_rating: number | null;
  pedagogy_rating: number | null;
  feedback_text: string | null;
  created_at: string;
}

const COLORS = {
  standard: "#0088FE",
  quality: "#00C49F", 
  pedagogy: "#FFBB28",
  count: "#8884d8",
  ratingsCount: "#82ca9d",
};

const Analytics: React.FC = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [folders, setFolders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // AI Summary states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiDialog, setShowAiDialog] = useState(false);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllFeedback();
      setFeedbackData(data as FeedbackData[]);
      
      // Extract unique folder names
      const uniqueFolders = Array.from(new Set((data as FeedbackData[]).map(item => item.folder_name)));
      setFolders(uniqueFolders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      
      // Retry on network failures
      if (retryCount < 2 && errorMessage.includes('Failed to fetch')) {
        console.log(`Retrying analytics data fetch (attempt ${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchFeedbackData(retryCount + 1);
      }
      
      if (errorMessage.includes('Failed to fetch')) {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected folders and date range
  const filteredData = feedbackData.filter(item => {
    const folderMatch = selectedFolders.length === 0 || selectedFolders.includes(item.folder_name);
    
    const dateMatch = !dateRange?.from || !dateRange?.to || 
      isWithinInterval(parseISO(item.created_at), {
        start: dateRange.from,
        end: dateRange.to,
      });
    
    return folderMatch && dateMatch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFolders, dateRange]);

  const exportData = () => {
    const exportData = filteredData.map(item => ({
      Date: new Date(item.created_at).toLocaleDateString(),
      Folder: item.folder_name,
      Domain: item.domain || '',
      Topic: item.topic || '',
      Standard: item.standard,
      QuizID: item.quiz_id,
      StandardRating: item.standard_alignment_rating || '',
      QualityRating: item.quality_rating || '',
      PedagogyRating: item.pedagogy_rating || '',
      FeedbackText: item.feedback_text || '',
    }));

    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape quotes in the value and wrap in quotes if contains comma
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics - only for ratings
  const totalFeedback = filteredData.length;
  const ratingsData = filteredData.filter(item => 
    item.standard_alignment_rating || item.quality_rating || item.pedagogy_rating
  );
  const feedbackWithText = filteredData.filter(item => item.feedback_text && item.feedback_text.trim().length > 0);
  
  const avgStandardRating = filteredData.reduce((sum, item) => sum + (item.standard_alignment_rating || 0), 0) / 
    filteredData.filter(item => item.standard_alignment_rating).length || 0;
  const avgQualityRating = filteredData.reduce((sum, item) => sum + (item.quality_rating || 0), 0) / 
    filteredData.filter(item => item.quality_rating).length || 0;
  const avgPedagogyRating = filteredData.reduce((sum, item) => sum + (item.pedagogy_rating || 0), 0) / 
    filteredData.filter(item => item.pedagogy_rating).length || 0;

  // Radar chart data for average ratings
  const radarData = [
    {
      category: 'Standard Alignment',
      rating: parseFloat(avgStandardRating.toFixed(2)),
      fullMark: 3
    },
    {
      category: 'Quality',
      rating: parseFloat(avgQualityRating.toFixed(2)),
      fullMark: 3
    },
    {
      category: 'Pedagogy',
      rating: parseFloat(avgPedagogyRating.toFixed(2)),
      fullMark: 3
    }
  ];

  const folderData = folders.map((folder) => {
    const folderFeedback = feedbackData.filter(item => item.folder_name === folder);
    const folderRatings = folderFeedback.filter(item => 
      item.standard_alignment_rating || item.quality_rating || item.pedagogy_rating
    );
    const avgStandard = folderFeedback.reduce((sum, item) => sum + (item.standard_alignment_rating || 0), 0) / 
      folderFeedback.filter(item => item.standard_alignment_rating).length || 0;
    const avgQuality = folderFeedback.reduce((sum, item) => sum + (item.quality_rating || 0), 0) / 
      folderFeedback.filter(item => item.quality_rating).length || 0;
    const avgPedagogy = folderFeedback.reduce((sum, item) => sum + (item.pedagogy_rating || 0), 0) / 
      folderFeedback.filter(item => item.pedagogy_rating).length || 0;
    
    return {
      folder_name: folder,
      total_feedback: folderFeedback.length,
      ratings_count: folderRatings.length,
      avg_standard: parseFloat(avgStandard.toFixed(2)),
      avg_quality: parseFloat(avgQuality.toFixed(2)),
      avg_pedagogy: parseFloat(avgPedagogy.toFixed(2)),
    };
  });

  const handleFolderToggle = (folder: string) => {
    setSelectedFolders(prev => 
      prev.includes(folder) 
        ? prev.filter(f => f !== folder)
        : [...prev, folder]
    );
  };

  const generateAiSummary = async () => {
    if (filteredData.length === 0) {
      setAiError('No feedback data available for analysis.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setShowAiDialog(true);

    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackData: filteredData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate AI summary');
      }

      const data = await response.json();
      setAiSummary(data.summary);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate AI summary');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading analytics data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="text-lg text-red-500">Error: {error}</div>
              {error.includes('Network connection issue') && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This is usually a temporary issue. Please try again.
                  </p>
                  <Button 
                    onClick={() => fetchFeedbackData()}
                    className="text-blue-600 hover:text-blue-700"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Quiz Analytics
            </h1>
            
            {/* Filters and Export */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-[300px] justify-between"
                  >
                    {selectedFolders.length === 0 
                      ? "Select folders" 
                      : selectedFolders.length === 1 
                        ? (selectedFolders[0].length > 30 ? selectedFolders[0].substring(0, 30) + "..." : selectedFolders[0])
                        : `${selectedFolders.length} folders`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <div className="p-2">
                    <div className="flex items-center px-2 py-1.5 text-sm font-semibold">
                      Select Folders
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {folders.map((folder) => (
                        <div
                          key={folder}
                          className="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                          onClick={() => handleFolderToggle(folder)}
                        >
                          <div className="flex h-4 w-4 items-center justify-center border border-primary rounded-sm">
                            {selectedFolders.includes(folder) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          <label className="text-xs flex-1 cursor-pointer leading-relaxed">
                      {folder}
                          </label>
                        </div>
                  ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Select date range"
              />

              <Button
                onClick={exportData}
                className="flex items-center gap-2"
                disabled={filteredData.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>

              {(selectedFolders.length > 0 || dateRange?.from) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFolders([]);
                    setDateRange(undefined);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Badge */}
          {(selectedFolders.length > 0 || dateRange?.from) && (
            <div className="flex gap-2 flex-wrap">
              {selectedFolders.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedFolders.map(folder => (
                    <Badge key={folder} variant="secondary">
                      {folder}
                </Badge>
                  ))}
                </div>
              )}
              {dateRange?.from && (
                <Badge variant="secondary">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  {dateRange.from.toLocaleDateString()} - {dateRange.to?.toLocaleDateString() || 'Now'}
                </Badge>
              )}
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFeedback}</div>
                <p className="text-xs text-muted-foreground">
                  Total responses received
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Overall Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((avgStandardRating + avgQualityRating + avgPedagogyRating) / 3).toFixed(2)}/3
                </div>
                <p className="text-xs text-muted-foreground">
                  Average across all categories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Standard Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgStandardRating.toFixed(2)}/3</div>
                <p className="text-xs text-muted-foreground">
                  Standard alignment score
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Quality Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgQualityRating.toFixed(2)}/3</div>
                <p className="text-xs text-muted-foreground">
                  Content quality score
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Pedagogy Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgPedagogyRating.toFixed(2)}/3</div>
                <p className="text-xs text-muted-foreground">
                  Teaching effectiveness
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart for Ratings */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 3]} />
                    <Radar
                      name="Rating"
                      dataKey="rating"
                      stroke={COLORS.standard}
                      fill={COLORS.standard}
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ratings by Folder */}
            {(selectedFolders.length === 0 || selectedFolders.length > 1) && (
              <Card>
                <CardHeader>
                  <CardTitle>Average Ratings by Folder</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={folderData.filter(folder => 
                      selectedFolders.length === 0 || selectedFolders.includes(folder.folder_name)
                    )}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="folder_name" />
                      <YAxis domain={[0, 3]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avg_standard" name="Standard" fill={COLORS.standard} />
                      <Bar dataKey="avg_quality" name="Quality" fill={COLORS.quality} />
                      <Bar dataKey="avg_pedagogy" name="Pedagogy" fill={COLORS.pedagogy} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Feedback Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Recent Feedback Details</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={generateAiSummary}
                  disabled={filteredData.length === 0 || aiLoading}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      AI Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Folder</th>
                      <th className="text-left p-3">Standard</th>
                      <th className="text-left p-3">Quiz ID</th>
                      <th className="text-left p-3">Ratings</th>
                      <th className="text-left p-3">Feedback Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {item.folder_name}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-[200px] truncate">{item.standard}</td>
                        <td className="p-3 font-mono text-xs">{item.quiz_id}</td>
                        <td className="p-3">
                          {(item.standard_alignment_rating || item.quality_rating || item.pedagogy_rating) ? (
                            <div className="flex flex-col gap-1 text-xs">
                              {item.standard_alignment_rating && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">S:</span> {item.standard_alignment_rating.toFixed(2)}/3
                                </span>
                              )}
                              {item.quality_rating && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Q:</span> {item.quality_rating.toFixed(2)}/3
                                </span>
                              )}
                              {item.pedagogy_rating && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">P:</span> {item.pedagogy_rating.toFixed(2)}/3
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No ratings</span>
                          )}
                        </td>
                        <td className="p-3 max-w-[400px]">
                          {item.feedback_text ? (
                            <div className="text-xs text-muted-foreground">
                              <p className="line-clamp-3 whitespace-pre-wrap">{item.feedback_text}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">No text feedback</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No feedback data found for the selected filters.
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        
                        if (totalPages <= maxVisiblePages) {
                          // Show all pages if total is small
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <Button
                                key={i}
                                variant={currentPage === i ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(i)}
                                className="w-8 h-8"
                              >
                                {i}
                              </Button>
                            );
                          }
                        } else {
                          // Always show first page
                          pages.push(
                            <Button
                              key={1}
                              variant={currentPage === 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              className="w-8 h-8"
                            >
                              1
                            </Button>
                          );
                          
                          // Show ellipsis if there's a gap
                          if (currentPage > 3) {
                            pages.push(<span key="ellipsis1" className="px-2">...</span>);
                          }
                          
                          // Show pages around current page
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);
                          
                          for (let i = start; i <= end; i++) {
                            pages.push(
                              <Button
                                key={i}
                                variant={currentPage === i ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(i)}
                                className="w-8 h-8"
                              >
                                {i}
                              </Button>
                            );
                          }
                          
                          // Show ellipsis if there's a gap
                          if (currentPage < totalPages - 2) {
                            pages.push(<span key="ellipsis2" className="px-2">...</span>);
                          }
                          
                          // Always show last page
                          if (totalPages > 1) {
                            pages.push(
                              <Button
                                key={totalPages}
                                variant={currentPage === totalPages ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                className="w-8 h-8"
                              >
                                {totalPages}
                              </Button>
                            );
                          }
                        }
                        
                        return pages;
                      })()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Summary Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Feedback Analysis
              {selectedFolders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedFolders.length === 1 
                    ? selectedFolders[0].substring(0, 30) + (selectedFolders[0].length > 30 ? '...' : '')
                    : `${selectedFolders.length} folders`}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {aiLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Analyzing feedback data with AI...</span>
              </div>
            )}
            
            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-red-800 font-medium">Error generating AI summary</h4>
                <p className="text-red-600 mt-1">{aiError}</p>
                <Button 
                  onClick={generateAiSummary} 
                  className="mt-3" 
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            )}
            
            {aiSummary && !aiLoading && (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Analysis Overview:</strong> Analyzed {filteredData.length} feedback entries
                    {selectedFolders.length > 0 && ` from ${selectedFolders.length} selected folder${selectedFolders.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: aiSummary
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^#{1,6}\s(.+)$/gm, (match, title) => {
                        const level = match.indexOf(' ');
                        return `<h${level} class="font-bold text-lg mt-4 mb-2">${title}</h${level}>`;
                      })
                      .replace(/\n\n/g, '</p><p class="mb-3">')
                      .replace(/^(.+)$/gm, '<p class="mb-3">$1</p>')
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics; 