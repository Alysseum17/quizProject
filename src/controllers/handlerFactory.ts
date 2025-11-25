import { Request, Response } from "express";
import { da } from "zod/locales";

export const getAll =  (model:any) => async (_req:Request, res:Response) => {
    const items = await model.findMany();
    res.status(200).json({items});
}


export const getOne =  (model:any) => async (req:Request, res:Response) => {
    const { id } = req.params;
    const item = await model.findUnique({
        where: { id: +id },
    });
    res.status(200).json({ item });
}

export const createOne =  (model:any, schema:any) => async (req:Request, res:Response) => {
    const data = schema.parse(req.body);
    const newItem = await model.create({
        data: data
    });
    res.status(201).json({ newItem });
}

export const deleteOne =  (model:any) => async (req:Request, res:Response) => {
    const { id } = req.params;
    await model.delete({
        where: { id: +id },
    });
    res.status(204).send('Item deleted successfully');
}

export const updateOne =  (model:any, schema:any) => async (req:Request, res:Response) => {
    const { id } = req.params;
    const data = schema.parse(req.body);
    console.log(data);
    const updatedItem = await model.update({
        where: { id: +id },
        data: data
    });
    res.status(200).json({ updatedItem });
}