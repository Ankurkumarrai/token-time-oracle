import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Calendar, Database } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PriceResult {
  price: number;
  source: "cache" | "alchemy" | "interpolated";
  timestamp?: number;
}

interface ScheduleProgress {
  token: string;
  network: string;
  progress: number;
  status: "running" | "completed" | "error";
}

export const TokenPriceForm = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [network, setNetwork] = useState<string>("");
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [scheduleProgress, setScheduleProgress] = useState<ScheduleProgress | null>(null);
  const { toast } = useToast();

  const handlePriceQuery = async () => {
    if (!tokenAddress || !network || !timestamp) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Calling price function with:", { token: tokenAddress, network, timestamp: parseInt(timestamp) });
      
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log("Using mock data - Supabase not configured");
        
        // Mock response for demonstration
        const sources = ["cache", "alchemy", "interpolated"] as const;
        const mockResult: PriceResult = {
          price: parseFloat((1.0 + Math.random() * 0.1).toFixed(6)),
          source: sources[Math.floor(Math.random() * sources.length)]
        };
        
        setTimeout(() => {
          setPriceResult(mockResult);
          setLoading(false);
          toast({
            title: "Price Retrieved (Mock)",
            description: `Found price: $${mockResult.price} (${mockResult.source})`,
          });
        }, 1500);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('price', {
        body: {
          token: tokenAddress,
          network,
          timestamp: parseInt(timestamp)
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || 'Failed to fetch price');
      }
      
      console.log("Price function response:", data);
      setPriceResult(data);
      
      toast({
        title: "Price Retrieved",
        description: `Found price: $${data.price} (${data.source})`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch token price",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleHistory = async () => {
    if (!tokenAddress || !network) {
      toast({
        title: "Missing Fields",
        description: "Please provide token address and network",
        variant: "destructive",
      });
      return;
    }

    setScheduling(true);
    try {
      console.log("Calling schedule function with:", { token: tokenAddress, network });
      
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log("Using mock schedule - Supabase not configured");
        
        setTimeout(() => {
          setScheduleProgress({
            token: tokenAddress,
            network,
            progress: 0,
            status: "running"
          });
          setScheduling(false);
          toast({
            title: "History Fetch Scheduled (Mock)",
            description: "Mock historical price fetching has been queued",
          });
        }, 1000);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('schedule', {
        body: {
          token: tokenAddress,
          network
        }
      });

      if (error) {
        console.error("Supabase schedule function error:", error);
        throw new Error(error.message || 'Failed to schedule history fetch');
      }
      
      console.log("Schedule function response:", data);
      
      setScheduleProgress({
        token: tokenAddress,
        network,
        progress: 0,
        status: "running"
      });

      toast({
        title: "History Fetch Scheduled",
        description: "Historical price fetching has been queued",
      });

      // Simulate progress updates (in real app, would use WebSocket or polling)
      const progressInterval = setInterval(() => {
        setScheduleProgress(prev => {
          if (!prev || prev.progress >= 100) {
            clearInterval(progressInterval);
            return prev;
          }
          const newProgress = Math.min(prev.progress + 10, 100);
          return {
            ...prev,
            progress: newProgress,
            status: newProgress === 100 ? "completed" : "running"
          };
        });
      }, 1000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule history fetch",
        variant: "destructive",
      });
    } finally {
      setScheduling(false);
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case "cache": return "secondary";
      case "alchemy": return "default";
      case "interpolated": return "outline";
      default: return "secondary";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "cache": return <Database className="w-3 h-3" />;
      case "alchemy": return <TrendingUp className="w-3 h-3" />;
      case "interpolated": return <Calendar className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Historical Token Price Oracle
        </h1>
        <p className="text-muted-foreground text-lg">
          Query historical token prices with advanced interpolation
        </p>
      </div>

      {/* Example Usage Card */}
      <Card className="bg-gradient-to-r from-info/10 to-primary/10 border-info/20">
        <CardHeader>
          <CardTitle className="text-lg">📋 Example Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Popular Token Addresses:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground font-mono">
                <li>• USDC: 0xA0b86a33E6417c8aDa77C2d6E2d8e26a4BB0e72C</li>
                <li>• UNI: 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984</li>
                <li>• WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2</li>
              </ul>
            </div>
            <div>
              <strong>Example Timestamps:</strong>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Jan 1, 2024: 1704067200</li>
                <li>• July 1, 2024: 1719792000</li>
                <li>• Current time: {Math.floor(Date.now() / 1000)}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Price Query Form */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Price Query
            </CardTitle>
            <CardDescription>
              Get historical price at a specific timestamp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tokenAddress">Token Address</Label>
              <div className="flex gap-2">
                <Input
                  id="tokenAddress"
                  placeholder="0xA0b869...c2d6 (e.g., USDC)"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="font-mono flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTokenAddress("0xA0b86a33E6417c8aDa77C2d6E2d8e26a4BB0e72C")}
                >
                  USDC
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Unix Timestamp</Label>
              <div className="flex gap-2">
                <Input
                  id="timestamp"
                  placeholder="1678901234"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  type="number"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTimestamp("1704067200")}
                >
                  2024
                </Button>
              </div>
            </div>

            <Button 
              onClick={handlePriceQuery} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Query Price
            </Button>

            {priceResult && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="text-2xl font-bold text-accent">
                        ${priceResult.price.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Source</span>
                      <Badge variant={getSourceBadgeVariant(priceResult.source)}>
                        {getSourceIcon(priceResult.source)}
                        <span className="ml-1 capitalize">{priceResult.source}</span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Schedule History Form */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Full History Fetch
            </CardTitle>
            <CardDescription>
              Schedule fetching all daily prices from token creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="scheduleToken">Token Address</Label>
              <Input
                id="scheduleToken"
                placeholder="0x1f9840...85d5 (e.g., UNI)"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleNetwork">Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleScheduleHistory} 
              disabled={scheduling}
              className="w-full"
              variant="outline"
            >
              {scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Full History
            </Button>

            {scheduleProgress && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">
                        {scheduleProgress.progress}%
                      </span>
                    </div>
                    <Progress value={scheduleProgress.progress} className="w-full" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={scheduleProgress.status === "completed" ? "default" : "secondary"}>
                        <span className="capitalize">{scheduleProgress.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};