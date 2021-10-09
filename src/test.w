1234567891
loop 20 0 for
  10 /mod 48 + 20 i - mem + !
  dup 1 < if
    i 1 +
    mem 20 i - +
    1
    33554436
    syscall3
    leave
  end
end


