"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Shield, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Send,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";

import { TOKEN_GATING_CONFIG } from '@/config/tokenGating';

const ADMIN_WALLETS = TOKEN_GATING_CONFIG.ADMIN_WALLETS;

interface DevRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  url?: string;
  user_wallet_address: string;
  created_at: string;
  updated_at: string;
  dev_request_files: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
  }>;
  dev_responses: Array<{
    id: string;
    response_text: string;
    is_admin: boolean;
    admin_wallet_address?: string;
    created_at: string;
  }>;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'bug': return '🐛';
    case 'feature': return '✨';
    case 'question': return '❓';
    case 'feedback': return '💭';
    default: return '📝';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <Clock className="h-4 w-4" />;
    case 'in_progress': return <AlertCircle className="h-4 w-4" />;
    case 'resolved': return <CheckCircle className="h-4 w-4" />;
    case 'closed': return <XCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

export function AdminDashboard() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [requests, setRequests] = useState<DevRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DevRequest | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const isAdmin = connected && publicKey?.toString() && ADMIN_WALLETS.includes(publicKey.toString());

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin]);

  const fetchRequests = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ask-the-dev/admin?admin_wallet=${publicKey?.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data.requests);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest || !responseText.trim() || !isAdmin) return;

    setIsSubmittingResponse(true);
    try {
      const response = await fetch('/api/ask-the-dev/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminWallet: publicKey?.toString(),
          requestId: selectedRequest.id,
          responseText,
          updateStatus: responseStatus || undefined,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Response sent!",
          description: "Your response has been sent to the user.",
        });
        
        setResponseText("");
        setResponseStatus("");
        setSelectedRequest(null);
        await fetchRequests(); // Refresh the list
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to send response.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch('/api/ask-the-dev/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminWallet: publicKey?.toString(),
          requestId,
          status: newStatus,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Status updated",
          description: `Request status changed to ${newStatus}.`,
        });
        await fetchRequests(); // Refresh the list
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Please connect your wallet to access the admin dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              Access denied. Admin privileges required.
            </p>
            <p className="text-xs text-muted-foreground">
              Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Dashboard
            </CardTitle>
            <Button
              onClick={fetchRequests}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage user requests and provide responses
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No requests found.</p>
              </div>
            ) : (
              requests.map((request) => (
                <Card key={request.id} className="border border-muted">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getCategoryIcon(request.category)}
                        </span>
                        <h3 className="font-semibold">{request.title}</h3>
                        <Badge
                          variant="outline"
                          className={`${getPriorityColor(request.priority)} text-white`}
                        >
                          {request.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDetails(
                            showDetails === request.id ? null : request.id
                          )}
                        >
                          {showDetails === request.id ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      From: {request.user_wallet_address.slice(0, 8)}...{request.user_wallet_address.slice(-8)} • 
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </CardHeader>

                  {showDetails === request.id && (
                    <CardContent className="pt-0 space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {request.description}
                        </p>
                      </div>

                      {request.url && (
                        <div>
                          <h4 className="font-medium mb-2">Related URL</h4>
                          <a 
                            href={request.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            {request.url}
                          </a>
                        </div>
                      )}

                      {request.dev_request_files.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Attachments</h4>
                          <div className="space-y-1">
                            {request.dev_request_files.map((file) => (
                              <div key={file.id} className="text-sm text-muted-foreground">
                                📎 {file.file_name} ({file.file_type})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.dev_responses.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Responses</h4>
                          <div className="space-y-2">
                            {request.dev_responses.map((response) => (
                              <div key={response.id} className="bg-muted p-3 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  {response.is_admin ? (
                                    <Badge variant="secondary">Admin</Badge>
                                  ) : (
                                    <Badge variant="outline">User</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(response.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">
                                  {response.response_text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleUpdateStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">🟡 Open</SelectItem>
                            <SelectItem value="in_progress">🟠 In Progress</SelectItem>
                            <SelectItem value="resolved">🟢 Resolved</SelectItem>
                            <SelectItem value="closed">🔴 Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          onClick={() => setSelectedRequest(request)}
                          variant="outline"
                          size="sm"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Respond
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Modal */}
      {selectedRequest && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Respond to: {selectedRequest.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Response
              </label>
              <Textarea
                placeholder="Type your response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Update Status (optional)
              </label>
              <Select value={responseStatus} onValueChange={setResponseStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">🟠 In Progress</SelectItem>
                  <SelectItem value="resolved">🟢 Resolved</SelectItem>
                  <SelectItem value="closed">🔴 Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() || isSubmittingResponse}
              >
                {isSubmittingResponse ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Response
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setResponseText("");
                  setResponseStatus("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}