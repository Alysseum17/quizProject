import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";


export const getAll =  (model:any) => catchAsync(async (_req:Request, res:Response) => {
    const items = await model.findMany();
    res.status(200).json({items});
});


export const getOne =  (model:any) => catchAsync(async (req:Request, res:Response, next: NextFunction) => {
    const { id } = req.params;
    const item = await model.findUnique({
        where: { id: +id },
    });
    if (!item) {
        return next(new AppError('No item found with that ID', 404));
    }
    res.status(200).json({ item });
});

export const createOne =  (model:any, schema:any) => catchAsync(async (req:Request, res:Response) => {
    let data = req.body;
    const user = (req as any).user;
    if(user) {
         data = {...req.body, author_id: user.id};
    }
    const dataParsed = schema.parse(data);
    const newItem = await model.create({
        data: dataParsed
    });
    res.status(201).json({ newItem });
});

export const deleteOne =  (model:any) => catchAsync(async (req:Request, res:Response) => {
    const { id } = req.params;
    await model.delete({
        where: { id: +id },
    });
    res.status(204).send('Item deleted successfully');
});

export const updateOne =  (model:any, schema:any) => catchAsync(async (req:Request, res:Response) => {
    const { id } = req.params;
    const data = schema.parse(req.body);
    const updatedItem = await model.update({
        where: { id: +id },
        data
    });
    res.status(200).json({ updatedItem });
});

export const softDelete =  (model:any) => catchAsync(async (req:Request, res:Response) => {
    const { id } = req.params;
    await model.update({
        where: { id: +id },
        data: { is_active: false }
    });
    res.status(204).send('Item soft-deleted successfully');
});