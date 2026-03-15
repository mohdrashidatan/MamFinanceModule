const analyzeTrustProxy = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const connectionIp =
    req.connection?.remoteAddress || req.socket?.remoteAddress;

  const analysis = {
    // Current request information
    currentConfig: {
      trustProxy: req.app.get("trust proxy"),
      reqIP: req.ip,
      reqIPs: req.ips,
    },

    // Raw connection data
    rawData: {
      connectionIP: connectionIp,
      xForwardedFor: forwardedFor,
      xRealIP: realIp,
      xForwardedProto: forwardedProto,
      xForwardedHost: forwardedHost,
    },

    // Analysis
    analysis: {
      hasProxy: false,
      proxyCount: 0,
      ipChain: [],
      detectedRealIP: null,
    },

    // Recommendation
    recommendation: {
      value: null,
      code: null,
      explanation: null,
      confidence: "low",
    },
  };

  // Analyze X-Forwarded-For header
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    analysis.analysis.hasProxy = true;
    analysis.analysis.proxyCount = ips.length;
    analysis.analysis.ipChain = ips;
    analysis.analysis.detectedRealIP = ips[0]; // First IP is usually the real client

    // Determine recommendation based on proxy count
    if (ips.length === 1) {
      analysis.recommendation.value = 1;
      analysis.recommendation.code = 'app.set("trust proxy", 1);';
      analysis.recommendation.explanation =
        "Single proxy detected (likely Nginx, ALB, or similar). This is the most common configuration.";
      analysis.recommendation.confidence = "high";
    } else if (ips.length === 2) {
      analysis.recommendation.value = 2;
      analysis.recommendation.code = 'app.set("trust proxy", 2);';
      analysis.recommendation.explanation =
        "Two proxies detected (likely CDN + Load Balancer, e.g., CloudFlare + Nginx).";
      analysis.recommendation.confidence = "high";
    } else if (ips.length >= 3) {
      analysis.recommendation.value = ips.length;
      analysis.recommendation.code = `app.set("trust proxy", ${ips.length});`;
      analysis.recommendation.explanation = `${ips.length} proxies detected. This might indicate multiple proxy layers (CDN + WAF + Load Balancer).`;
      analysis.recommendation.confidence = "medium";
    }
  } else if (realIp) {
    // Some proxies use X-Real-IP instead
    analysis.analysis.hasProxy = true;
    analysis.analysis.proxyCount = 1;
    analysis.analysis.detectedRealIP = realIp;

    analysis.recommendation.value = 1;
    analysis.recommendation.code = 'app.set("trust proxy", 1);';
    analysis.recommendation.explanation =
      "Single proxy detected using X-Real-IP header (common with Nginx).";
    analysis.recommendation.confidence = "high";
  } else {
    // No proxy headers detected
    analysis.recommendation.value = false;
    analysis.recommendation.code = "// Do NOT set trust proxy";
    analysis.recommendation.explanation =
      "No proxy detected. Your app is directly exposed to the internet. Do not enable trust proxy as it would allow IP spoofing.";
    analysis.recommendation.confidence = "high";
  }

  // Check if current configuration is correct
  const currentTrustProxy = req.app.get("trust proxy");
  analysis.configurationStatus = {
    isConfigured:
      currentTrustProxy !== undefined && currentTrustProxy !== false,
    isCorrect: false,
    currentValue: currentTrustProxy,
    recommendedValue: analysis.recommendation.value,
  };

  if (analysis.recommendation.value === false) {
    analysis.configurationStatus.isCorrect =
      !analysis.configurationStatus.isConfigured;
  } else {
    analysis.configurationStatus.isCorrect =
      currentTrustProxy === analysis.recommendation.value ||
      currentTrustProxy === true;
  }

  return analysis;
};

/**
 * Create a debug endpoint to test trust proxy configuration
 */
const createTrustProxyDebugger = () => {
  return (req, res) => {
    const analysis = analyzeTrustProxy(req);

    // Add helpful instructions
    const response = {
      message: "🔍 Trust Proxy Configuration Analysis",
      timestamp: new Date().toISOString(),

      ...analysis,
    };

    res.json(response);
  };
};

/**
 * Create a simple IP info endpoint
 */
const createIPInfoEndpoint = () => {
  return (req, res) => {
    res.json({
      message: "IP Information",
      yourIP: req.ip,
      allIPs: req.ips,
      trustProxyEnabled:
        req.app.get("trust proxy") !== undefined &&
        req.app.get("trust proxy") !== false,
      headers: {
        "x-forwarded-for": req.headers["x-forwarded-for"],
        "x-real-ip": req.headers["x-real-ip"],
      },
    });
  };
};

module.exports = {
  analyzeTrustProxy,
  createTrustProxyDebugger,
  createIPInfoEndpoint,
};
