"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
export async function getEvents() {
  const events = await prisma.event.findMany({
    include: {
      organizer: true,
    },
  });
  return events;
}

type createEventType = {
  title: string;
  description: string;
  venue: string;
  startDate: any;
  endDate: any;
  image: string;
  theme: string;
  eventStatus: "DRAFT" | "PUBLISHED";
};
export async function createEvent(data: createEventType) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  try {
    const event = await prisma.event.create({
      data: {
        description: data.description,
        endDate: new Date(data.endDate),
        title: data.title,
        image: data.image,
        startDate: new Date(data.startDate),
        theme: data.theme,
        venue: data.venue,
        eventStatus: data.eventStatus,

        organizerId: session.user.id,
      },
    });
    return {
      error: false,
      event,
    };
  } catch (error) {
    return {
      error: true,
      message: "An error occurred",
    };
  }
}

export async function getEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      organizer: true,
      attendees: {
        include: {
          attendee: true,
        },
      },
      posters: true,
    },
  });
  return event!;
}

export async function registerEvent(eventId: string) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
    return;
  }

  try {
    const registration = await prisma.eventAttendees.create({
      data: {
        eventId,
        attendeeId: session.user.id,
      },
    });
    return {
      error: false,
      registration,
    };
  } catch (error) {
    return {
      error: true,
      message: "An error occurred",
    };
  }
}

export const updateEvent = async (eventId: string, data: createEventType) => {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
    return;
  }
  console.log("-----HELLO WORLD");
  try {
    const event = await prisma.event.update({
      where: {
        id: eventId,
        organizerId: session.user.id,
      },
      data: {
        description: data.description,
        endDate: new Date(data.endDate),
        title: data.title,
        image: data.image,
        startDate: new Date(data.startDate),
        theme: data.theme,
        venue: data.venue,
        eventStatus: data.eventStatus,
        organizerId: session.user.id,
      },
    });
    return {
      error: false,
      event,
    };
  } catch (error) {
    return {
      error: true,
      message: "An error occurred",
    };
  }
};

export const telegramNotify = async (message: string) => {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }
  console.log("CALLED OK");
  try {
    const telegramChatId = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        telegramChatId: true,
      },
    });

    const res = await fetch(
      `https://eventee-event-buddy-bot.vercel.app/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegramChatId?.telegramChatId,
          update:message,
        }),
      }
    );
    const response = await res.json();
    console.log({ response, telegramChatId });
    return {
      error: false,
      response,
    };
  } catch (error) {
    return {
      error: true,
      message: "An error occurred",
    };
  }
};
