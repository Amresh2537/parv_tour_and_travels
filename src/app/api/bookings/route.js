// This is now a proxy to Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIdfdRGKtmJ88cWtpi6ZWfebnAfTuiYgWBv7xYn5EF_bmsEXcQnP6y3jIarIoC4Hbb/exec';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');
    const action = searchParams.get('action') || (bookingId ? 'getBooking' : 'getAll');
    
    let url = APPS_SCRIPT_URL + `?action=${action}`;
    
    if (bookingId) {
      url += `&bookingId=${bookingId}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const result = await response.json();
    
    return Response.json(result);
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}