/**
 * WebKaar API Handler
 */
'use strict';

const API_CONFIG = {
    baseUrlIP: 'https://ipwho.is/', 
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
            console.error('API Request Failed:', error);
            return null;
        }
    }

    static async getNetworkInfo() {
        const data = await this.request(API_CONFIG.baseUrlIP);
        
        if (data && data.success) {
            return {
                success: true,
                ip: data.ip,
                city: data.city,
                country: data.country,
                isp: data.connection.isp,
                timezone: data.timezone.id,
                flag: data.flag.img,
                latitude: data.latitude,
                longitude: data.longitude
            };
        } else {
            return {
                success: false,
                error: 'Service unavailable'
            };
        }
    }
}

// Ye line sabse zaroori hai
window.WebKaarAPI = API;