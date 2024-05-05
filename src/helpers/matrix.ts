
export function matrix_vector_mult(M:number[][], P:number[]): number[] {
    let ans:number[] = Array.from({length: P.length}, ()=>0);

    for (let i=0; i<M.length; i++) {
        for (let j=0; j<M[0].length; j++) {
            ans[i] += M[i][j] * P[j];
        }
    }
    return ans;
}

export function matrix_const_mult(P:number[], c:number):number[] {
    P.forEach(pp => pp * c);
    return P
}

export function matrix_matrix_add(P:number[], M:number[]):number[] {
    for (let i=0; i<P.length; i++) {
        P[i] += M[i];
    }
    return P;
}

export function is_similar(P:number[], Q:number[], delta:number):boolean {
    let sum = 0;
    for (let i=0; i<P.length; i++) {
        sum += Math.abs(P[i] - Q[i])
    }
    return sum <= delta;
}

export function normalize(P:number[]): number[] {
    let sum = 0;
    for (let i=0; i<P.length; i++) sum += P[i];
    for (let i=0; i<P.length; i++) P[i] /= sum;
    return P;
}