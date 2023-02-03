import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { convertHoursStringTominutes } from './utils/convert-hours-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string'


const app = express()

app.use(express.json());

// app.use(cors({
//     origin: 'https://api.andreycode.com' 
// }))
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
})

app.get('/games', async (resquet, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                }
            }
        }
    })

    return response.json(games);
})

app.post('/games/:id/ads', async (resquet, response) => {
    const gameId = resquet.params.id;
    const   body: any = resquet.body;

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHoursStringTominutes(body.hourStart),
            hourEnd: convertHoursStringTominutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
        }
    })

    return response.status(201).json(ad);
});

app.get('/ads', (resquet, response) => {
    return response.json([])
})

app.get('/games/:id/ads', async (resquet, response) => {
    const gameId = resquet.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAt: 'desc',
        }
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd),
        }
    }));
})

app.get('/ads/:id/discord', async (resquet, response) => {
    const adId = resquet.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },
        where: {
            id: adId
        }
    })

    return response.json({
        discord: ad.discord,
    });
})

app.listen(8080||process.env.PORT, ()=>{
    console.log('server os running ...')
})