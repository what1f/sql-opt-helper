package backend

import (
    "fmt"
    "math/rand"
    "sync"
    "testing"
    "time"

    "github.com/panjf2000/ants/v2"
)

func TestBenchmark_Run(t *testing.T) {
    b := &Benchmark{}
    b.InitDB(&Config{
        Driver:     "mysql",
        Path:       "localhost:3306",
        Username:   "root",
        Password:   "123456",
        Database:   "test",
        Threads:    []int{100},
        Iterations: 1000,
    })
    fmt.Println(b.Run("select * from user"))
}

func TestAnts(t *testing.T) {
    pool, err := ants.NewPool(2, ants.WithPreAlloc(true))
    defer pool.Release()
    if err != nil {
        t.Fatal(err)
    }
    start := time.Now()
    res := make(chan int, 20)
    var wg sync.WaitGroup
    for i := 0; i < 20; i++ {
        wg.Add(1)
        pool.Submit(func() {
            defer wg.Done()
            t := rand.Intn(1000)
            time.Sleep(time.Duration(t) * time.Millisecond)
            res <- t
        })
    }
    wg.Wait()
    close(res)
    sum := 0
    for v := range res {
        sum += v
    }
    fmt.Println("total:", time.Now().Sub(start))
    fmt.Println("sum:", sum)
}
