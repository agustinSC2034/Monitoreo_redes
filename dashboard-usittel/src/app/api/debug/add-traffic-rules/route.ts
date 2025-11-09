/**
 * 🚨 API para agregar reglas de cambios bruscos
 * 
 * GET /api/debug/add-traffic-rules
 */

import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db-supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDB();
    
    const newRules = [
      {
        name: 'CABASE - Caída brusca >50%',
        sensor_id: '13682',
        condition: 'traffic_drop',
        threshold: 50,
        priority: 'high',
        channels: JSON.stringify(['email', 'whatsapp']),
        recipients: JSON.stringify(['agustin.scutari@it-tel.com.ar', '+5491124682247']),
        cooldown: 300,
        enabled: true
      },
      {
        name: 'IPLANxARSAT - Aumento brusco >50%',
        sensor_id: '13684',
        condition: 'traffic_spike',
        threshold: 50,
        priority: 'medium',
        channels: JSON.stringify(['email', 'whatsapp']),
        recipients: JSON.stringify(['agustin.scutari@it-tel.com.ar', '+5491124682247']),
        cooldown: 300,
        enabled: true
      },
      {
        name: 'IPLANxARSAT - Caída brusca >50%',
        sensor_id: '13684',
        condition: 'traffic_drop',
        threshold: 50,
        priority: 'medium',
        channels: JSON.stringify(['email', 'whatsapp']),
        recipients: JSON.stringify(['agustin.scutari@it-tel.com.ar', '+5491124682247']),
        cooldown: 300,
        enabled: true
      }
    ];
    
    const results = [];
    
    for (const rule of newRules) {
      const { data, error } = await db
        .from('alert_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) {
        results.push({ rule: rule.name, success: false, error: error.message });
      } else {
        results.push({ rule: rule.name, success: true, id: data.id });
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
