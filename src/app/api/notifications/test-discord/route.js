import { NextResponse } from 'next/server';
import { sendDiscordMessage } from '@/lib/discord';

/**
 * Test Discord webhook endpoint
 * GET /api/notifications/test-discord
 */
export async function GET() {
    try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (!webhookUrl) {
            return NextResponse.json(
                { error: 'DISCORD_WEBHOOK_URL not configured in environment variables' },
                { status: 500 }
            );
        }

        // Test message
        const testPayload = {
            content: '✅ Discord Webhook接続テスト成功！',
            embeds: [{
                title: 'テスト通知',
                description: 'KCI Task Manager からのテストメッセージです。',
                color: 0x00ff00, // Green
                fields: [
                    {
                        name: 'ステータス',
                        value: '正常',
                        inline: true
                    },
                    {
                        name: 'タイムスタンプ',
                        value: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString()
            }]
        };

        await sendDiscordMessage(webhookUrl, testPayload);

        return NextResponse.json({
            success: true,
            message: 'Test notification sent successfully'
        });

    } catch (error) {
        console.error('Test Discord notification failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to send test notification',
                details: error.message
            },
            { status: 500 }
        );
    }
}
