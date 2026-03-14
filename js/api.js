/**
 * WebKaar API Handler (Ultra Robust Fallback System)
 */
'use strict';

const API_CONFIG = {
    endpoints: [
        'https://ipwho.is/',
        'https://ipapi.co/json/',
        'https://api.ipify.org?format=json'
    ],
    timeout: 8000
};

class API {
    static async request(url) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            clearTimeout(id);
            console.error(`API Failed: ${url}`, error);
            return null; // Return null so the next fallback triggers
        }
    }

    static async getNetworkInfo() {
        // Try APIs one by one until one succeeds
        for (let url of API_CONFIG.endpoints) {
            const data = await this.request(url);
            
            if (data) {
                let result = { success: true };

                // 1. IPWHO.IS Format
                if (data.connection && data.success !== false) {
                    result.ip = data.ip;
                    result.city = data.city;
                    result.country = data.country;
                    result.isp = data.connection.isp;
                    result.timezone = data.timezone.id;
                    result.flag = data.flag.img;
                    result.lat = data.latitude;
                    result.lon = data.longitude;
                    return result;
                } 
                // 2. IPAPI.CO Format
                else if (data.org || data.asn) {
                    result.ip = data.ip;
                    result.city = data.city || 'Unknown City';
                    result.country = data.country_name || 'Unknown Country';
                    result.isp = data.org || data.asn;
                    result.timezone = data.timezone || 'Unknown';
                    result.flag = `https://flagcdn.com/24x18/${data.country.toLowerCase()}.png`;
                    result.lat = data.latitude;
                    result.lon = data.longitude;
                    return result;
                }
                // 3. IPIFY Format (Just IP as last resort)
                else if (data.ip) {
                    result.ip = data.ip;
                    result.city = 'Hidden';
                    result.country = 'Hidden';
                    result.isp = 'Unknown ISP';
                    result.timezone = '-';
                    result.flag = '';
                    return result;
                }
            }
        }

        // If all 3 APIs fail
        return { success: false, error: 'Network Offline or API Blocked' };
    }
}

// Global initialization
window.WebKaarAPI = API;