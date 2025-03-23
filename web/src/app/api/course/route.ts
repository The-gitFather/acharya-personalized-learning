import { NextResponse } from "next/server";

// It's better to use environment variable for API key
const API_KEY = process.env.SERP_API_KEY || "555e1650dcfeb69fdfe704d298b0396b66172413026edf642b954be707bfaa50";

export async function GET(request: Request) {
  try {
    // Get search query from URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Construct the SerpAPI URL with proper encoding
    const serpApiUrl = new URL("https://serpapi.com/search.json");
    serpApiUrl.searchParams.append("q", `books:${query}`);
    serpApiUrl.searchParams.append("location", "India");
    serpApiUrl.searchParams.append("hl", "hi");
    serpApiUrl.searchParams.append("gl", "in");
    serpApiUrl.searchParams.append("google_domain", "google.co.in");
    serpApiUrl.searchParams.append("api_key", API_KEY);

    // Fetch data from SerpAPI
    const response = await fetch(serpApiUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SerpAPI error:", errorText);
      
      return NextResponse.json(
        { error: "Failed to fetch search results" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return successful response
    return NextResponse.json(data);

  } catch (error) {
    // Log the error for debugging
    console.error("API Route Error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}