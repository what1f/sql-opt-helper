package backend

func sum[T int | int64 | float64](list []T) (s T) {
    for _, v := range list {
        s += v
    }
    return s
}
