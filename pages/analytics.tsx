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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { CalendarDays, Filter, TrendingUp, Download, MessageSquare, BarChart3, FileText } from 'lucide-react';

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
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const data = await getAllFeedback();
      setFeedbackData(data as FeedbackData[]);
      
      // Extract unique folder names
      const uniqueFolders = Array.from(new Set((data as FeedbackData[]).map(item => item.folder_name)));
      setFolders(uniqueFolders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected folder and date range
  const filteredData = feedbackData.filter(item => {
    const folderMatch = selectedFolder === 'all' || item.folder_name === selectedFolder;
    
    const dateMatch = !dateRange?.from || !dateRange?.to || 
      isWithinInterval(parseISO(item.created_at), {
        start: dateRange.from,
        end: dateRange.to,
      });
    
    return folderMatch && dateMatch;
  });

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

  // Prepare chart data
  const ratingData = [
    { 
      category: 'Standard Alignment', 
      rating: Number(avgStandardRating.toFixed(1)),
      fill: COLORS.standard
    },
    { 
      category: 'Quality', 
      rating: Number(avgQualityRating.toFixed(1)),
      fill: COLORS.quality
    },
    { 
      category: 'Pedagogy', 
      rating: Number(avgPedagogyRating.toFixed(1)),
      fill: COLORS.pedagogy
    }
  ];

  // Radar chart data for average ratings
  const radarData = [
    {
      category: 'Standard Alignment',
      rating: avgStandardRating,
      fullMark: 5
    },
    {
      category: 'Quality',
      rating: avgQualityRating,
      fullMark: 5
    },
    {
      category: 'Pedagogy',
      rating: avgPedagogyRating,
      fullMark: 5
    }
  ];

  const folderData = folders.map((folder) => {
    const folderFeedback = feedbackData.filter(item => item.folder_name === folder);
    const folderRatings = folderFeedback.filter(item => 
      item.standard_alignment_rating || item.quality_rating || item.pedagogy_rating
    );
    return {
      folder_name: folder,
      total_feedback: folderFeedback.length,
      ratings_count: folderRatings.length,
      avg_standard: folderFeedback.reduce((sum, item) => sum + (item.standard_alignment_rating || 0), 0) / 
        folderFeedback.filter(item => item.standard_alignment_rating).length || 0,
      avg_quality: folderFeedback.reduce((sum, item) => sum + (item.quality_rating || 0), 0) / 
        folderFeedback.filter(item => item.quality_rating).length || 0,
      avg_pedagogy: folderFeedback.reduce((sum, item) => sum + (item.pedagogy_rating || 0), 0) / 
        folderFeedback.filter(item => item.pedagogy_rating).length || 0,
    };
  });

  // Timeline data (feedback over time)
  const timelineData = filteredData.reduce((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.count += 1;
      existing.ratingsCount += (item.standard_alignment_rating || item.quality_rating || item.pedagogy_rating) ? 1 : 0;
    } else {
      acc.push({ 
        date, 
        count: 1,
        ratingsCount: (item.standard_alignment_rating || item.quality_rating || item.pedagogy_rating) ? 1 : 0
      });
    }
    return acc;
  }, [] as { date: string; count: number; ratingsCount: number }[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
            <div className="text-lg text-red-500">Error: {error}</div>
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
              
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

              {(selectedFolder !== 'all' || dateRange?.from) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFolder('all');
                    setDateRange(undefined);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Badge */}
          {(selectedFolder !== 'all' || dateRange?.from) && (
            <div className="flex gap-2">
              {selectedFolder !== 'all' && (
                <Badge variant="secondary">
                  Folder: {selectedFolder}
                </Badge>
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
                  {((avgStandardRating + avgQualityRating + avgPedagogyRating) / 3).toFixed(2)}/5
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
                <div className="text-2xl font-bold">{avgStandardRating.toFixed(2)}/5</div>
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
                <div className="text-2xl font-bold">{avgQualityRating.toFixed(2)}/5</div>
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
                <div className="text-2xl font-bold">{avgPedagogyRating.toFixed(2)}/5</div>
                <p className="text-xs text-muted-foreground">
                  Teaching effectiveness
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Average Ratings Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Average Ratings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="rating" fill={COLORS.standard} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

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
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
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
            {selectedFolder === 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>Average Ratings by Folder</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={folderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="folder_name" />
                      <YAxis domain={[0, 5]} />
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

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" strokeWidth={2} name="Total Feedback" stroke={COLORS.count} />
                    <Line type="monotone" dataKey="ratingsCount" strokeWidth={2} name="With Ratings" stroke={COLORS.ratingsCount} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feedback Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback Details</CardTitle>
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
                    {filteredData.slice(0, 20).map((item) => (
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
                                  <span className="font-medium">S:</span> {item.standard_alignment_rating}/5
                                </span>
                              )}
                              {item.quality_rating && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Q:</span> {item.quality_rating}/5
                                </span>
                              )}
                              {item.pedagogy_rating && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">P:</span> {item.pedagogy_rating}/5
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 