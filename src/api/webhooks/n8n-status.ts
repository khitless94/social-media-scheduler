// Webhook endpoint to receive status updates from n8n
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      postId,
      queueId,
      status,
      platformPostIds,
      errorMessage,
      executionId,
      successCount,
      failureCount
    } = req.body;

    console.log('📨 Received n8n status update:', {
      postId,
      status,
      successCount,
      failureCount
    });

    // Update post status in database
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        scheduling_status: status === 'completed' ? 'published' : 
                          status === 'failed' ? 'failed' : 
                          status === 'partial' ? 'published' : status,
        platform_post_ids: platformPostIds,
        error_message: errorMessage,
        n8n_execution_id: executionId,
        published_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) {
      console.error('❌ Error updating post status:', updateError);
      return res.status(500).json({ error: 'Database update failed' });
    }

    // Optional: Send real-time notification to user
    // You can implement WebSocket or Server-Sent Events here

    console.log('✅ Post status updated successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Status updated successfully' 
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
